import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTourContext } from '../../contexts/TourContext';
import { TourStep } from './TourStep';
import { AgentResponse, Controls, FormState } from '../../types';
import { parseSampleAgentResponse, SAMPLE_AGENT_RESPONSE } from '../../utils/tourHelper';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TourControllerProps {
    setFormState: React.Dispatch<React.SetStateAction<FormState>>;
    setControls: React.Dispatch<React.SetStateAction<Controls>>;
    setOutput: React.Dispatch<React.SetStateAction<AgentResponse | null>>;
    handleClearForm: () => void;
    handleUseSampleData: () => void;
}

export const TourController: React.FC<TourControllerProps> = (props) => {
  const { t } = useTranslation(['tour']);
  const { isTourActive, currentStepIndex, nextStep, prevStep, stopTour } = useTourContext();
  const { setFormState, setControls, setOutput, handleClearForm, handleUseSampleData } = props;
  const wasTourActive = useRef(isTourActive);

  useEffect(() => {
    // When tour transitions from active to inactive, run cleanup.
    if (wasTourActive.current && !isTourActive) {
      handleClearForm();

      // Reset to "Select Meeting" tab as default
      const selectMeetingTab = document.getElementById('tab-select-meeting');
      if (selectMeetingTab && !selectMeetingTab.classList.contains('bg-white')) {
        (selectMeetingTab as HTMLButtonElement).click();
      }

      // Close advanced settings if open
      const advancedSettingsButton = document.getElementById('advanced-settings-button');
      if (advancedSettingsButton?.textContent?.includes('Hide')) {
          (advancedSettingsButton as HTMLButtonElement).click();
      }

      // Close any open modals
      const closeButtons = document.querySelectorAll('[aria-label="Close"]');
      closeButtons.forEach(button => {
        if (button) {
          (button as HTMLButtonElement).click();
        }
      });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Close the user menu if it was opened by the tour
      const menuButton = document.querySelector('#user-profile-menu button');
      const isMenuOpen = menuButton?.getAttribute('aria-expanded') === 'true';
      if(isMenuOpen) {
          (menuButton as HTMLButtonElement).click();
      }

      // Reset calendar to today (if calendar exists)
      const todayButton = document.getElementById('calendar-today-button');
      if (todayButton) {
        (todayButton as HTMLButtonElement).click();
      }
    }
    wasTourActive.current = isTourActive;
  }, [isTourActive, handleClearForm]);

  const tourSteps = useMemo(() => [
    // Part 1: Basic Flow
    {
      selector: '#input-panel',
      title: t('tour:controllerSteps.step1.title'),
      content: t('tour:controllerSteps.step1.content'),
      placement: 'right' as const,
      beforeAction: async () => {
        handleClearForm();
        const advancedSettingsButton = document.getElementById('advanced-settings-button');
        if (advancedSettingsButton?.textContent?.includes('Hide')) {
            (advancedSettingsButton as HTMLButtonElement).click();
        }
      }
    },
    // New Step 2: Tab Navigation
    {
      selector: '#tab-select-meeting',
      title: t('tour:controllerSteps.step2.title'),
      content: t('tour:controllerSteps.step2.content'),
      placement: 'bottom' as const,
      beforeAction: async () => {
        // Ensure "Select Meeting" tab is active
        const selectMeetingTab = document.getElementById('tab-select-meeting');
        if (selectMeetingTab && !selectMeetingTab.classList.contains('bg-white')) {
          (selectMeetingTab as HTMLButtonElement).click();
          await wait(300);
        }
      }
    },
    // New Step 3: Calendar Picker
    {
      selector: '#calendar-picker',
      title: t('tour:controllerSteps.step3.title'),
      content: t('tour:controllerSteps.step3.content'),
      placement: 'bottom' as const,
    },
    // New Step 4: Today Button
    {
      selector: '#calendar-today-button',
      title: t('tour:controllerSteps.step4.title'),
      content: t('tour:controllerSteps.step4.content'),
      placement: 'bottom' as const,
      beforeAction: async () => {
        const todayButton = document.getElementById('calendar-today-button');
        if (todayButton) {
          (todayButton as HTMLButtonElement).click();
          await wait(500);
        }
      }
    },
    // New Step 5: Navigation Arrows
    {
      selector: '#calendar-prev-week',
      title: t('tour:controllerSteps.step5.title'),
      content: t('tour:controllerSteps.step5.content'),
      placement: 'bottom' as const,
    },
    // New Step 6: Meeting List
    {
      selector: '#meeting-list',
      title: t('tour:controllerSteps.step6.title'),
      content: t('tour:controllerSteps.step6.content'),
      placement: 'top' as const,
      beforeAction: async () => {
        await wait(200);
        const meetingList = document.getElementById('meeting-list');
        if (meetingList) {
          meetingList.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await wait(300);
        }
      }
    },
    // New Step 7: Transcript Status Badges
    {
      selector: '#meeting-card-0',
      title: t('tour:controllerSteps.step7.title'),
      content: t('tour:controllerSteps.step7.content'),
      placement: 'top' as const,
      beforeAction: async () => {
        const meetingCard = document.getElementById('meeting-card-0');
        if (meetingCard) {
          meetingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await wait(300);
        }
      }
    },
    // New Step 8: Meeting Card Expansion
    {
      selector: '#meeting-card-0',
      title: t('tour:controllerSteps.step8.title'),
      content: t('tour:controllerSteps.step8.content'),
      placement: 'top' as const,
      beforeAction: async () => {
        const meetingCard = document.getElementById('meeting-card-0');
        if (meetingCard && !(meetingCard.querySelector('#process-meeting-button'))) {
          (meetingCard as HTMLElement).click();
          await wait(500);
        }
      }
    },
    // New Step 9: Process This Meeting
    {
      selector: '#process-meeting-button',
      title: t('tour:controllerSteps.step9.title'),
      content: t('tour:controllerSteps.step9.content'),
      placement: 'top' as const,
      beforeAction: async () => {
        const processButton = document.getElementById('process-meeting-button');
        if (processButton) {
          processButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await wait(300);
        }
      }
    },
    // New Step 10: View Participants
    {
      selector: '#view-participants-button',
      title: t('tour:controllerSteps.step10.title'),
      content: t('tour:controllerSteps.step10.content'),
      placement: 'top' as const,
      beforeAction: async () => {
        // Click process button if not already processed
        const processButton = document.getElementById('process-meeting-button');
        if (processButton) {
          (processButton as HTMLButtonElement).click();
          await wait(1000);
        }
        const viewParticipantsButton = document.getElementById('view-participants-button');
        if (viewParticipantsButton) {
          viewParticipantsButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await wait(300);
        }
      }
    },
    // New Step 11: View Transcript
    {
      selector: '#view-transcript-button',
      title: t('tour:controllerSteps.step11.title'),
      content: t('tour:controllerSteps.step11.content'),
      placement: 'top' as const,
      beforeAction: async () => {
        // Close participants modal if open
        const closeButton = document.querySelector('[aria-label="Close"]');
        if (closeButton) {
          (closeButton as HTMLButtonElement).click();
          await wait(300);
        }
      }
    },
    // Old Step 2 (now Step 12): Transcript Input Section
    {
      selector: '#transcript-input-section',
      title: t('tour:controllerSteps.step12.title'),
      content: t('tour:controllerSteps.step12.content'),
      placement: 'right' as const,
      beforeAction: async () => {
        // Switch to Paste Transcript tab
        const pasteTranscriptTab = document.getElementById('tab-paste-transcript');
        if (pasteTranscriptTab) {
          (pasteTranscriptTab as HTMLButtonElement).click();
          await wait(300);
        }
      }
    },
    // Old Step 3 (now Step 13): Use Sample Data
    {
      selector: '#use-sample-data-button',
      title: t('tour:controllerSteps.step13.title'),
      content: t('tour:controllerSteps.step13.content'),
      placement: 'top' as const,
      beforeAction: async () => {
        handleUseSampleData();
        await wait(200);
      }
    },
    {
      selector: '#meeting-presets-section',
      title: t('tour:controllerSteps.step14.title'),
      content: t('tour:controllerSteps.step14.content'),
      placement: 'right' as const,
    },
    {
        selector: '#preset-button-client-update',
        title: t('tour:controllerSteps.step15.title'),
        content: t('tour:controllerSteps.step15.content'),
        placement: 'bottom' as const,
        beforeAction: async () => {
            (document.getElementById('preset-button-client-update') as HTMLButtonElement)?.click();
            await wait(200);
        }
    },
    {
        selector: '#preset-button-internal-sync',
        title: t('tour:controllerSteps.step16.title'),
        content: t('tour:controllerSteps.step16.content'),
        placement: 'bottom' as const,
        beforeAction: async () => {
            (document.getElementById('preset-button-internal-sync') as HTMLButtonElement)?.click();
            await wait(200);
        }
    },
    {
        selector: '#preset-button-brainstorm',
        title: t('tour:controllerSteps.step17.title'),
        content: t('tour:controllerSteps.step17.content'),
        placement: 'top' as const,
        beforeAction: async () => {
            (document.getElementById('preset-button-brainstorm') as HTMLButtonElement)?.click();
            await wait(200);
        }
    },
    {
        selector: '#preset-button-executive-briefing',
        title: t('tour:controllerSteps.step18.title'),
        content: t('tour:controllerSteps.step18.content'),
        placement: 'top' as const,
        beforeAction: async () => {
            (document.getElementById('preset-button-executive-briefing') as HTMLButtonElement)?.click();
            await wait(200);
        }
    },
    {
      selector: '#generate-button',
      title: t('tour:controllerSteps.step19.title'),
      content: t('tour:controllerSteps.step19.content'),
      placement: 'bottom' as const,
      beforeAction: async () => {
        (document.getElementById('generate-button-wrapper') as HTMLElement)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await wait(200);
      }
    },
    {
      selector: '#output-panel-wrapper',
      title: t('tour:controllerSteps.step20.title'),
      content: t('tour:controllerSteps.step20.content'),
      placement: 'left' as const,
      beforeAction: async () => {
        setOutput(parseSampleAgentResponse(SAMPLE_AGENT_RESPONSE));
        await wait(300);
        document.getElementById('output-panel-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    {
      selector: '#first-workstream-section',
      title: t('tour:controllerSteps.step21.title'),
      content: t('tour:controllerSteps.step21.content'),
      placement: 'left' as const,
    },
    {
        selector: '#next-steps-section',
        title: t('tour:controllerSteps.step22.title'),
        content: t('tour:controllerSteps.step22.content'),
        placement: 'left' as const,
    },
    {
        selector: '#critical-review-section',
        title: t('tour:controllerSteps.step23.title'),
        content: t('tour:controllerSteps.step23.content'),
        placement: 'left' as const,
    },
    {
        selector: '#meeting-coach-panel',
        title: t('tour:controllerSteps.step24.title'),
        content: t('tour:controllerSteps.step24.content'),
        placement: 'left' as const,
    },
    {
        selector: '#export-bar',
        title: t('tour:controllerSteps.step25.title'),
        content: t('tour:controllerSteps.step25.content'),
        placement: 'bottom' as const,
    },
    {
      selector: '#interrogate-transcript-button',
      title: t('tour:controllerSteps.step26.title'),
      content: t('tour:controllerSteps.step26.content'),
      placement: 'bottom' as const,
      beforeAction: async () => {
        (document.getElementById('interrogate-transcript-button') as HTMLButtonElement)?.click();
        await wait(400); // Wait for modal animation
      }
    },
    {
      selector: '#interrogate-transcript-modal',
      title: t('tour:controllerSteps.step27.title'),
      content: t('tour:controllerSteps.step27.content'),
      placement: 'left' as const,
    },
    {
        selector: '#input-panel',
        title: t('tour:controllerSteps.step28.title'),
        content: t('tour:controllerSteps.step28.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Close the modal if it's open
            const closeButton = document.getElementById('interrogate-modal-close-button');
            if (closeButton) {
                (closeButton as HTMLButtonElement).click();
                await wait(400); // Wait for modal animation
            }

            // Clear form and scroll to top
            handleClearForm();
            setOutput(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            await wait(300); // Allow time for scroll and state updates
        }
    },
    {
        selector: '#advanced-settings-button',
        title: t('tour:controllerSteps.step29.title'),
        content: t('tour:controllerSteps.step29.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Check if advanced settings panel is already visible
            const panel = document.getElementById('advanced-settings-panel');
            if (!panel) {
                // Panel not visible, need to open it
                const button = document.getElementById('advanced-settings-button');
                if (button) {
                    (button as HTMLButtonElement).click();
                    await wait(500); // Wait for animation to complete
                }
            }
        }
    },
    {
        selector: '#advanced-settings-panel',
        title: t('tour:controllerSteps.step30.title'),
        content: t('tour:controllerSteps.step30.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Ensure advanced settings are open
            const panel = document.getElementById('advanced-settings-panel');
            if (!panel) {
                const button = document.getElementById('advanced-settings-button');
                if (button) {
                    (button as HTMLButtonElement).click();
                    await wait(500);
                }
            }
        }
    },
    {
        selector: '#advanced-settings-panel',
        title: t('tour:controllerSteps.step31.title'),
        content: t('tour:controllerSteps.step31.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Ensure advanced settings are open
            const panel = document.getElementById('advanced-settings-panel');
            if (!panel) {
                const button = document.getElementById('advanced-settings-button');
                if (button) {
                    (button as HTMLButtonElement).click();
                    await wait(500);
                }
            }
            (document.getElementById('preset-button-client-update') as HTMLButtonElement)?.click();
            await wait(500);
        }
    },
    {
        selector: '#advanced-settings-panel',
        title: t('tour:controllerSteps.step32.title'),
        content: t('tour:controllerSteps.step32.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Ensure advanced settings are open
            const panel = document.getElementById('advanced-settings-panel');
            if (!panel) {
                const button = document.getElementById('advanced-settings-button');
                if (button) {
                    (button as HTMLButtonElement).click();
                    await wait(500);
                }
            }
            (document.getElementById('preset-button-internal-sync') as HTMLButtonElement)?.click();
            await wait(500);
        }
    },
    {
        selector: '#context-tags-section',
        title: t('tour:controllerSteps.step33.title'),
        content: t('tour:controllerSteps.step33.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Ensure advanced settings are open
            const panel = document.getElementById('advanced-settings-panel');
            if (!panel) {
                const button = document.getElementById('advanced-settings-button');
                if (button) {
                    (button as HTMLButtonElement).click();
                    await wait(500);
                }
            }
        }
    },
    {
        selector: '#department-focus-section',
        title: t('tour:controllerSteps.step34.title'),
        content: t('tour:controllerSteps.step34.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Ensure advanced settings are open
            const panel = document.getElementById('advanced-settings-panel');
            if (!panel) {
                const button = document.getElementById('advanced-settings-button');
                if (button) {
                    (button as HTMLButtonElement).click();
                    await wait(500);
                }
            }
        }
    },
    {
        selector: '#audience-section',
        title: t('tour:controllerSteps.step35.title'),
        content: t('tour:controllerSteps.step35.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Ensure advanced settings are open
            const panel = document.getElementById('advanced-settings-panel');
            if (!panel) {
                const button = document.getElementById('advanced-settings-button');
                if (button) {
                    (button as HTMLButtonElement).click();
                    await wait(500);
                }
            }
        }
    },
    {
        selector: '#tone-section',
        title: t('tour:controllerSteps.step36.title'),
        content: t('tour:controllerSteps.step36.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Ensure advanced settings are open
            const panel = document.getElementById('advanced-settings-panel');
            if (!panel) {
                const button = document.getElementById('advanced-settings-button');
                if (button) {
                    (button as HTMLButtonElement).click();
                    await wait(500);
                }
            }
        }
    },
     {
        selector: '#view-mode-section',
        title: t('tour:controllerSteps.step37.title'),
        content: t('tour:controllerSteps.step37.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Ensure advanced settings are open
            const panel = document.getElementById('advanced-settings-panel');
            if (!panel) {
                const button = document.getElementById('advanced-settings-button');
                if (button) {
                    (button as HTMLButtonElement).click();
                    await wait(500);
                }
            }
        }
    },
    {
        selector: '#format-toggles-section',
        title: t('tour:controllerSteps.step38.title'),
        content: t('tour:controllerSteps.step38.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Ensure advanced settings are open
            const panel = document.getElementById('advanced-settings-panel');
            if (!panel) {
                const button = document.getElementById('advanced-settings-button');
                if (button) {
                    (button as HTMLButtonElement).click();
                    await wait(500);
                }
            }
        }
    },
    {
        selector: '#meeting-coach-section',
        title: t('tour:controllerSteps.step39.title'),
        content: t('tour:controllerSteps.step39.content'),
        placement: 'right' as const,
        beforeAction: async () => {
            // Ensure advanced settings are open
            const panel = document.getElementById('advanced-settings-panel');
            if (!panel) {
                const button = document.getElementById('advanced-settings-button');
                if (button) {
                    (button as HTMLButtonElement).click();
                    await wait(500);
                }
            }
        }
    },
    {
      selector: '#user-profile-menu',
      title: t('tour:controllerSteps.step40.title'),
      content: t('tour:controllerSteps.step40.content'),
      placement: 'left' as const,
      beforeAction: async () => {
          const menuButton = document.querySelector('#user-profile-menu button');
          if (menuButton) {
              const isMenuOpen = menuButton.getAttribute('aria-expanded') === 'true';
              if (!isMenuOpen) {
                  (menuButton as HTMLButtonElement).click();
                  await wait(300); // give menu time to open
              }
          }
      }
    },
  ], [t, handleClearForm, handleUseSampleData, setOutput]);

  const currentStepConfig = tourSteps[currentStepIndex];

  useEffect(() => {
    if (isTourActive && currentStepConfig && currentStepConfig.beforeAction) {
      currentStepConfig.beforeAction();
    }
  }, [isTourActive, currentStepConfig]);


  if (!isTourActive || !currentStepConfig) {
    return null;
  }

  return (
    <TourStep
      step={currentStepConfig}
      isFirst={currentStepIndex === 0}
      isLast={currentStepIndex === tourSteps.length - 1}
      onNext={nextStep}
      onPrev={prevStep}
      onStop={stopTour}
      currentStepIndex={currentStepIndex}
      totalSteps={tourSteps.length}
    />
  );
};