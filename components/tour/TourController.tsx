import React, { useEffect, useMemo, useRef } from 'react';
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
  const { isTourActive, currentStepIndex, nextStep, prevStep, stopTour } = useTourContext();
  const wasTourActive = useRef(isTourActive);

  useEffect(() => {
    // When tour transitions from active to inactive, run cleanup.
    if (wasTourActive.current && !isTourActive) {
      props.handleClearForm();
      const advancedSettingsButton = document.getElementById('advanced-settings-button');
      if (advancedSettingsButton?.textContent?.includes('Hide')) {
          (advancedSettingsButton as HTMLButtonElement).click();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Close the user menu if it was opened by the tour
      const menuButton = document.querySelector('#user-profile-menu button');
      const isMenuOpen = menuButton?.getAttribute('aria-expanded') === 'true';
      if(isMenuOpen) {
          (menuButton as HTMLButtonElement).click();
      }
    }
    wasTourActive.current = isTourActive;
  }, [isTourActive, props]);

  const tourSteps = useMemo(() => [
    // Part 1: Basic Flow
    {
      selector: '#input-panel',
      title: 'Welcome to the Note Crafter!',
      content: 'This tour will walk you through the key features. Let\'s get started.',
      placement: 'right' as const,
      beforeAction: async () => {
        props.handleClearForm();
        const advancedSettingsButton = document.getElementById('advanced-settings-button');
        if (advancedSettingsButton?.textContent?.includes('Hide')) {
            (advancedSettingsButton as HTMLButtonElement).click();
        }
      }
    },
    {
      selector: '#transcript-input-section',
      title: '1. Provide Your Content',
      content: 'Only the transcript is mandatory. If you provide an agenda, the generated notes will follow that structure.',
      placement: 'right' as const,
    },
    {
      selector: '#use-sample-data-button',
      title: 'Use Sample Data',
      content: 'For this tour, we\'ll load some sample data to see how it works.',
      placement: 'top' as const,
      beforeAction: async () => {
        props.handleUseSampleData();
        await wait(200);
      }
    },
    {
      selector: '#meeting-presets-section',
      title: '2. Select a Preset',
      content: 'Presets are the fastest way to configure your notes. Let\'s look at a few common meeting types.',
      placement: 'right' as const,
    },
    {
        selector: '#preset-button-client-update',
        title: 'Preset: Client Update',
        content: 'This preset is optimized for external meetings. It uses a client-ready tone and redacts personal info.',
        placement: 'bottom' as const,
        beforeAction: async () => {
            (document.getElementById('preset-button-client-update') as HTMLButtonElement)?.click();
            await wait(200);
        }
    },
    {
        selector: '#preset-button-internal-sync',
        title: 'Preset: Internal Sync',
        content: 'Ideal for team check-ins. This preset uses a more detailed, professional tone and enables the critical review.',
        placement: 'bottom' as const,
        beforeAction: async () => {
            (document.getElementById('preset-button-internal-sync') as HTMLButtonElement)?.click();
            await wait(200);
        }
    },
    {
        selector: '#preset-button-brainstorm',
        title: 'Preset: Brainstorm',
        content: 'Use this for creative sessions. It generates concise notes and helps identify emerging themes and actions.',
        placement: 'top' as const,
        beforeAction: async () => {
            (document.getElementById('preset-button-brainstorm') as HTMLButtonElement)?.click();
            await wait(200);
        }
    },
    {
        selector: '#preset-button-executive-briefing',
        title: 'Preset: Executive Briefing',
        content: 'Creates a high-level summary with a concise tone, perfect for leadership updates.',
        placement: 'top' as const,
        beforeAction: async () => {
            (document.getElementById('preset-button-executive-briefing') as HTMLButtonElement)?.click();
            await wait(200);
        }
    },
    {
      selector: '#generate-button',
      title: '3. Generate Notes',
      content: 'When you\'re ready, click here. For the tour, we\'ll instantly show a sample result.',
      placement: 'bottom' as const,
      beforeAction: async () => {
        (document.getElementById('generate-button-wrapper') as HTMLElement)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await wait(200);
      }
    },
    {
      selector: '#output-panel-wrapper',
      title: '4. Review Your Output',
      content: 'Here are your structured, professional notes. Let\'s look at the key sections.',
      placement: 'left' as const,
      beforeAction: async () => {
        props.setOutput(parseSampleAgentResponse(SAMPLE_AGENT_RESPONSE));
        await wait(300);
        document.getElementById('output-panel-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    {
      selector: '#first-workstream-section',
      title: 'Workstream Notes',
      content: 'The agent organizes the transcript into sections based on your agenda, extracting key points, decisions, and risks.',
      placement: 'left' as const,
    },
    {
        selector: '#next-steps-section',
        title: 'Next Steps',
        content: 'All next steps are automatically extracted into a clear, organized table with owners, due dates, and a RAG status.',
        placement: 'left' as const,
    },
    {
        selector: '#critical-review-section',
        title: 'Critical Review',
        content: 'This section (enabled by some presets) analyzes gaps, risks, and unassigned tasks.',
        placement: 'left' as const,
    },
    {
        selector: '#meeting-coach-panel',
        title: 'Meeting Coach',
        content: 'Get AI-powered feedback on your meeting\'s effectiveness. This is for you only and won\'t be exported.',
        placement: 'left' as const,
    },
    {
        selector: '#export-bar',
        title: '5. Export Your Notes',
        content: 'Easily copy, download as a PDF, or draft an email with your generated notes.',
        placement: 'bottom' as const,
    },
    {
      selector: '#interrogate-transcript-button',
      title: '6. Interrogate Transcript',
      content: 'Have a specific question? Use this feature to chat with an AI agent that knows the content of your transcript.',
      placement: 'bottom' as const,
      beforeAction: async () => {
        (document.getElementById('interrogate-transcript-button') as HTMLButtonElement)?.click();
        await wait(400); // Wait for modal animation
      }
    },
    {
      selector: '#interrogate-transcript-modal',
      title: 'Ask Anything',
      content: 'You can ask for summaries, key decisions, or who was responsible for certain tasks. The agent will answer based only on the provided transcript.',
      placement: 'left' as const,
    },
    {
        selector: '#input-panel',
        title: 'Fine-Tuning the Output',
        content: 'Next, we\'ll explore advanced settings to tailor your output. The form has been cleared, and we\'re back at the top to continue.',
        placement: 'right' as const,
        beforeAction: async () => {
            // Close the modal if it's open
            const closeButton = document.getElementById('interrogate-modal-close-button');
            if (closeButton) {
                (closeButton as HTMLButtonElement).click();
                await wait(400); // Wait for modal animation
            }
            
            // Clear form and scroll to top
            props.handleClearForm();
            props.setOutput(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            await wait(300); // Allow time for scroll and state updates
        }
    },
    {
        selector: '#advanced-settings-button',
        title: 'Show Advanced Settings',
        content: 'Each preset is just a combination of these advanced settings. Let\'s open the panel to see them.',
        placement: 'right' as const,
        beforeAction: async () => {
            const button = document.getElementById('advanced-settings-button');
            if (button?.textContent?.includes('Show')) {
                (button as HTMLButtonElement).click();
                await wait(400); // Wait for animation to complete
            }
        }
    },
    {
        selector: '#advanced-settings-panel',
        title: 'Advanced Settings Panel',
        content: 'Here you can manually control every aspect of the output.',
        placement: 'right' as const,
    },
    {
        selector: '#advanced-settings-panel',
        title: 'Dynamic Settings',
        content: 'Watch how the settings in this panel change when we select the \'Client Update\' preset. Note the \'Redact PII\' and \'Client-Ready\' tone.',
        placement: 'right' as const,
        beforeAction: async () => {
            (document.getElementById('preset-button-client-update') as HTMLButtonElement)?.click();
            await wait(500);
        }
    },
    {
        selector: '#advanced-settings-panel',
        title: 'Dynamic Settings',
        content: 'Now let\'s try \'Internal Sync\'. It enables the \'Critical Lens\' and uses icons for better readability.',
        placement: 'right' as const,
        beforeAction: async () => {
            (document.getElementById('preset-button-internal-sync') as HTMLButtonElement)?.click();
            await wait(500);
        }
    },
    {
        selector: '#context-tags-section',
        title: 'Context Tags',
        content: 'Apply tags like "Sensitive" or "Client facing" to give the AI important context about the meeting content.',
        placement: 'right' as const,
    },
    {
        selector: '#department-focus-section',
        title: 'Department Focus',
        content: 'Select one or more departments to have the AI prioritize their related discussions and action items in the summary.',
        placement: 'right' as const,
    },
    {
        selector: '#audience-section',
        title: 'Audience',
        content: 'Tailor the summary\'s level of detail. \'Executive\' is high-level, while \'Department\' is more granular.',
        placement: 'right' as const,
    },
    {
        selector: '#tone-section',
        title: 'Tone',
        content: 'Adjust the writing style of the notes, from professional to concise or polished for clients.',
        placement: 'right' as const,
    },
     {
        selector: '#view-mode-section',
        title: 'View Mode',
        content: 'Choose between the full, detailed minutes or a version that shows only the action items.',
        placement: 'right' as const,
    },
    {
        selector: '#format-toggles-section',
        title: 'Formatting Toggles',
        content: 'Use these switches to enable the Critical Lens, redact personal info (PII), add icons, or bold important keywords.',
        placement: 'right' as const,
    },
    {
        selector: '#meeting-coach-section',
        title: 'Meeting Coach Settings',
        content: 'You can disable the Meeting Coach or change its feedback style from supportive ("Gentle") to more direct.',
        placement: 'right' as const,
    },
    {
      selector: '#user-profile-menu',
      title: 'You\'re All Set!',
      content: 'That covers all the features. You can replay this tour any time from this menu by clicking "Replay Tutorial".',
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
  ], [props]);

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