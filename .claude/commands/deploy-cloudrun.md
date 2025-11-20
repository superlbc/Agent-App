---
allowed-tools: Bash, Read, Grep
description: Deploy application to Google Cloud Run with pre-deployment checks
---

You are deploying the application to Google Cloud Run.

## STEP 1: Pre-Deployment Checks

**Check for uncommitted changes:**
```bash
!git status
```

If there are uncommitted changes:
- ❌ **STOP**: Ask user if they want to commit first
- Deployment should be from clean state

**Check environment variables:**
```bash
!cat .env.example
```

Verify:
- [ ] All required env vars documented
- [ ] User knows to set them in Google Cloud Run

**Run security check (optional but recommended):**
```
Do you want to run a security scan before deploying? (Recommended)
If yes: invoke @agent-security-scanner
```

**Run visual check (optional but recommended):**
```
Do you want to run a design review before deploying? (Recommended for UI changes)
If yes: invoke @agent-design-reviewer
```

## STEP 2: Build Check

**Verify package.json scripts:**
```bash
!grep -A 5 '"scripts"' package.json
```

**Run production build locally:**
```bash
!npm run build
```

If build fails:
- ❌ **STOP**: Fix build errors before deploying
- Show error messages to user

If build succeeds:
- ✅ Continue to deployment

## STEP 3: Cloud Run Deployment

**Check if gcloud is configured:**
```bash
!gcloud config list
```

**Set project (if needed):**
```bash
!gcloud config set project [PROJECT_ID]
```

**Deploy to Cloud Run:**
```bash
!gcloud run deploy [SERVICE_NAME] \
  --source . \
  --platform managed \
  --region [REGION] \
  --allow-unauthenticated
```

**Common options:**
- `--region us-central1` (or user's preferred region)
- `--allow-unauthenticated` (for public apps)
- `--set-env-vars KEY=value` (for environment variables)
- `--memory 512Mi` (adjust as needed)

## STEP 4: Post-Deployment

**Get service URL:**
```bash
!gcloud run services describe [SERVICE_NAME] --region [REGION] --format 'value(status.url)'
```

**Test the deployment:**
```
Service deployed at: [URL]

Would you like me to:
1. Test the deployed app with Playwright?
2. Run a quick smoke test?
```

## STEP 5: Report

**Provide deployment summary:**
```markdown
## Deployment Complete ✅

**Service:** [SERVICE_NAME]
**Region:** [REGION]
**URL:** [DEPLOYED_URL]

## Pre-Deployment Checks
- [✅/❌] Git status clean
- [✅/❌] Build successful
- [✅/❌] Security scan passed (if run)
- [✅/❌] Design review passed (if run)

## Environment Variables
[List required env vars that need to be set in Cloud Run console]

## Next Steps
1. Set environment variables in Cloud Run console (if not set via command)
2. Test the deployed application
3. Monitor logs: `gcloud run logs tail [SERVICE_NAME]`

## Rollback (if needed)
View previous revisions:
`gcloud run revisions list --service [SERVICE_NAME]`

Rollback to previous version:
`gcloud run services update-traffic [SERVICE_NAME] --to-revisions [REVISION]=100`
```

## ERROR HANDLING

**If gcloud not found:**
- Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
- Run: `gcloud init`

**If authentication fails:**
- Run: `gcloud auth login`
- Run: `gcloud auth configure-docker`

**If deployment fails:**
- Check error message
- Verify Dockerfile (if using)
- Check build logs
- Verify package.json scripts

**If service won't start:**
- Check Cloud Run logs: `gcloud run logs tail [SERVICE_NAME]`
- Verify environment variables are set
- Check for missing dependencies

## CONFIGURATION TEMPLATE

**For first-time setup, ask user:**
```
I need the following information for deployment:

1. **Project ID**: [your-gcp-project-id]
2. **Service Name**: [app-name] (e.g., "my-app")
3. **Region**: [region] (e.g., "us-central1")
4. **Memory**: [512Mi/1Gi/2Gi] (default: 512Mi)
5. **Allow unauthenticated**: [yes/no] (is this a public app?)

Environment Variables needed:
- DATABASE_URL=?
- API_KEY=?
- [other variables from .env.example]
```

## NOTES

- **Always verify** before deploying to production
- **Check costs** - Google Cloud Run has pricing based on usage
- **Set up monitoring** - Use Cloud Run metrics and logging
- **Configure custom domain** (optional) via Cloud Run console
- **Enable CI/CD** for automatic deployments (optional)
