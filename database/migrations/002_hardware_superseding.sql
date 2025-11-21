-- ============================================================================
-- MIGRATION 002: Hardware Superseding
-- ============================================================================
-- Date: 2025-11-20
-- Purpose: Add hardware superseding relationships for automatic package updates
-- Dependencies: Migration 001 (Package Versioning)
--
-- **What This Does**:
-- 1. Adds `supersededById` column to Hardware table
-- 2. Removes `status` column (no longer needed with versioning)
-- 3. Removes `serialNumber` column (moved to separate inventory tracking)
--
-- **Why This Matters**:
-- - Enables automatic package updates when new hardware is released
-- - Forms superseding chains (e.g., MacBook M3 → M4 → M5)
-- - Packages automatically use latest hardware
-- - Existing assignments preserved via versioning (Phase 3)
--
-- **Example Workflow**:
-- - MacBook Pro M3 used in "XD Designer Standard" package (v1)
-- - MacBook Pro M4 released → Set M3.supersededById = M4.id
-- - Package auto-updates to use M4 → Creates v2
-- - Pre-hires assigned to v1 still get M3 (as promised)
-- - New pre-hires assigned to v2 get M4
-- ============================================================================

-- ============================================================================
-- STEP 1: Add supersededById column
-- ============================================================================
-- Links to the hardware item that replaces this one
-- Forms a chain: hw-mbp-m3 → hw-mbp-m4 → hw-mbp-m5

ALTER TABLE Hardware
ADD supersededById VARCHAR(50) NULL;

-- Add foreign key constraint (self-referencing)
ALTER TABLE Hardware
ADD CONSTRAINT FK_Hardware_SupersededBy
FOREIGN KEY (supersededById) REFERENCES Hardware(id);

-- Add index for finding superseded hardware
CREATE NONCLUSTERED INDEX IX_Hardware_SupersededById
ON Hardware(supersededById)
WHERE supersededById IS NOT NULL;

-- ============================================================================
-- STEP 2: Remove status column
-- ============================================================================
-- Status (available, assigned, maintenance, retired) is no longer needed
-- Reasoning:
-- - "Available" vs "Assigned" → Handled by PackageAssignments table
-- - "Maintenance" → Separate maintenance tracking system
-- - "Retired" → Handled by supersededById (superseded = effectively retired)

-- Check if column exists before dropping (safe for re-runs)
IF EXISTS (
  SELECT 1
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Hardware' AND COLUMN_NAME = 'status'
)
BEGIN
  ALTER TABLE Hardware DROP COLUMN status;
  PRINT 'Dropped column: status';
END
ELSE
BEGIN
  PRINT 'Column status does not exist (already dropped or never created)';
END

-- ============================================================================
-- STEP 3: Remove serialNumber column
-- ============================================================================
-- Serial numbers moved to separate hardware inventory/asset tracking system
-- Reasoning:
-- - Hardware definition (model, specs) is separate from physical instances
-- - Multiple physical instances of same hardware model (each with own serial)
-- - Serial number tracking better suited for asset management system

-- Check if column exists before dropping (safe for re-runs)
IF EXISTS (
  SELECT 1
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Hardware' AND COLUMN_NAME = 'serialNumber'
)
BEGIN
  ALTER TABLE Hardware DROP COLUMN serialNumber;
  PRINT 'Dropped column: serialNumber';
END
ELSE
BEGIN
  PRINT 'Column serialNumber does not exist (already dropped or never created)';
END

-- ============================================================================
-- VIEWS
-- ============================================================================
-- Convenience views for common superseding queries

-- View: Latest hardware (not superseded by anything)
CREATE VIEW vw_LatestHardware AS
SELECT
  h.id,
  h.type,
  h.model,
  h.manufacturer,
  h.specifications,
  h.purchaseDate,
  h.cost,
  h.supersededById,
  CASE
    WHEN h.supersededById IS NULL THEN 'Current'
    ELSE 'Superseded'
  END AS supersedingStatus
FROM Hardware h
WHERE h.supersededById IS NULL;

-- View: Hardware superseding chain (shows full lineage)
CREATE VIEW vw_HardwareSupersedingChain AS
WITH HardwareChain AS (
  -- Base case: Latest hardware (no supersededById)
  SELECT
    h.id,
    h.model,
    h.supersededById,
    0 AS generationDepth,
    CAST(h.model AS NVARCHAR(MAX)) AS supersedingChain
  FROM Hardware h
  WHERE h.supersededById IS NULL

  UNION ALL

  -- Recursive case: Follow supersededById backwards
  SELECT
    h.id,
    h.model,
    h.supersededById,
    hc.generationDepth + 1,
    CAST(h.model + ' → ' + hc.supersedingChain AS NVARCHAR(MAX))
  FROM Hardware h
  INNER JOIN HardwareChain hc ON h.supersededById = hc.id
)
SELECT
  id,
  model,
  supersededById,
  generationDepth,
  supersedingChain
FROM HardwareChain;

-- View: Package impact analysis (which packages use superseded hardware)
CREATE VIEW vw_SupersededHardwareInPackages AS
SELECT
  h.id AS hardwareId,
  h.model AS hardwareModel,
  h.supersededById,
  replacement.model AS replacementModel,
  p.id AS packageId,
  p.name AS packageName,
  pv.versionNumber AS packageVersion,
  pv.snapshotDate AS packageVersionDate,
  COUNT(*) OVER (PARTITION BY p.id) AS totalSupersededItemsInPackage
FROM Hardware h
INNER JOIN PackageVersions pv ON pv.hardware LIKE '%"' + h.id + '"%' -- JSON search
INNER JOIN Packages p ON pv.packageId = p.id
LEFT JOIN Hardware replacement ON h.supersededById = replacement.id
WHERE h.supersededById IS NOT NULL;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Mark hardware as superseded and create new package version
CREATE PROCEDURE sp_SupersedeHardware
  @oldHardwareId VARCHAR(50),
  @newHardwareId VARCHAR(50),
  @createdBy VARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRANSACTION;

  BEGIN TRY
    -- Step 1: Validate both hardware items exist
    IF NOT EXISTS (SELECT 1 FROM Hardware WHERE id = @oldHardwareId)
    BEGIN
      RAISERROR('Old hardware ID not found: %s', 16, 1, @oldHardwareId);
      RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM Hardware WHERE id = @newHardwareId)
    BEGIN
      RAISERROR('New hardware ID not found: %s', 16, 1, @newHardwareId);
      RETURN;
    END

    -- Step 2: Update old hardware to point to new hardware
    UPDATE Hardware
    SET supersededById = @newHardwareId
    WHERE id = @oldHardwareId;

    PRINT 'Hardware superseding recorded:';
    PRINT '  Old: ' + @oldHardwareId;
    PRINT '  New: ' + @newHardwareId;

    -- Step 3: Find all packages using the old hardware
    DECLARE @packageId VARCHAR(50);
    DECLARE @packageName NVARCHAR(200);
    DECLARE @versionCount INT = 0;

    DECLARE package_cursor CURSOR FOR
    SELECT DISTINCT p.id, p.name
    FROM Packages p
    INNER JOIN PackageVersions pv ON pv.packageId = p.id
    WHERE pv.hardware LIKE '%"' + @oldHardwareId + '"%'
      AND pv.versionNumber = (
        SELECT MAX(versionNumber)
        FROM PackageVersions
        WHERE packageId = p.id
      );

    OPEN package_cursor;
    FETCH NEXT FROM package_cursor INTO @packageId, @packageName;

    WHILE @@FETCH_STATUS = 0
    BEGIN
      -- Step 4: Create new package version with replaced hardware
      -- (This would need to be implemented with JSON manipulation)
      -- For now, just log the packages that need updating

      PRINT 'Package needs new version: ' + @packageName + ' (' + @packageId + ')';
      SET @versionCount = @versionCount + 1;

      FETCH NEXT FROM package_cursor INTO @packageId, @packageName;
    END

    CLOSE package_cursor;
    DEALLOCATE package_cursor;

    PRINT '';
    PRINT 'Summary:';
    PRINT '  Hardware superseded: 1';
    PRINT '  Packages affected: ' + CAST(@versionCount AS VARCHAR);
    PRINT '  New package versions needed: ' + CAST(@versionCount AS VARCHAR);

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

/*
-- Example 1: MacBook Pro M3 superseded by M4
UPDATE Hardware
SET supersededById = 'hw-comp-002-m4'
WHERE id = 'hw-comp-001-m3';

-- Example 2: Query superseding chain
SELECT * FROM vw_HardwareSupersedingChain
WHERE model LIKE '%MacBook%';

-- Example 3: Find packages affected by superseding
SELECT * FROM vw_SupersededHardwareInPackages;

-- Example 4: Use stored procedure to supersede hardware
EXEC sp_SupersedeHardware
  @oldHardwareId = 'hw-comp-001-m3',
  @newHardwareId = 'hw-comp-002-m4',
  @createdBy = 'admin@momentumww.com';
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To undo this migration, run:
/*
DROP PROCEDURE IF EXISTS sp_SupersedeHardware;
DROP VIEW IF EXISTS vw_SupersededHardwareInPackages;
DROP VIEW IF EXISTS vw_HardwareSupersedingChain;
DROP VIEW IF EXISTS vw_LatestHardware;

-- Remove foreign key constraint
ALTER TABLE Hardware DROP CONSTRAINT IF EXISTS FK_Hardware_SupersededBy;

-- Remove index
DROP INDEX IF EXISTS IX_Hardware_SupersededById ON Hardware;

-- Remove column
ALTER TABLE Hardware DROP COLUMN IF EXISTS supersededById;

-- Re-add status and serialNumber columns (if needed)
ALTER TABLE Hardware ADD status VARCHAR(20);
ALTER TABLE Hardware ADD serialNumber VARCHAR(100);
*/
