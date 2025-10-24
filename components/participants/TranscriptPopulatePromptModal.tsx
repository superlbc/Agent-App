import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface TranscriptPopulatePromptModalProps {
    isOpen: boolean;
    participantCount: number;
    onYes: () => void;
    onNo: () => void;
    onDoNotAskAgain?: (checked: boolean) => void;
}

/**
 * Modal that prompts user to auto-populate participants after uploading/pasting a transcript
 * Only shown when participants are detected in the transcript
 */
export const TranscriptPopulatePromptModal: React.FC<TranscriptPopulatePromptModalProps> = ({
    isOpen,
    participantCount,
    onYes,
    onNo,
    onDoNotAskAgain
}) => {
    const { t } = useTranslation(['common']);
    const [doNotAskAgain, setDoNotAskAgain] = useState(false);

    const handleYes = () => {
        if (onDoNotAskAgain) {
            onDoNotAskAgain(doNotAskAgain);
        }
        onYes();
    };

    const handleNo = () => {
        if (onDoNotAskAgain) {
            onDoNotAskAgain(doNotAskAgain);
        }
        onNo();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4"
            onClick={onNo}
        >
            <Card
                className="w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Icon name="group" className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white text-center mb-2">
                        {t('common:participantExtraction.promptTitle')}
                    </h2>

                    {/* Message */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                        {t('common:participantExtraction.promptMessage', { count: participantCount })}
                    </p>

                    {/* Do Not Ask Again Checkbox */}
                    <div className="flex items-center justify-center mb-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={doNotAskAgain}
                                onChange={(e) => setDoNotAskAgain(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary focus:ring-offset-0"
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                {t('common:participantExtraction.doNotAskAgain')}
                            </span>
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleNo}
                            variant="secondary"
                            className="flex-1"
                        >
                            {t('common:participantExtraction.noButton')}
                        </Button>
                        <Button
                            onClick={handleYes}
                            variant="primary"
                            className="flex-1"
                        >
                            {t('common:participantExtraction.yesButton')}
                        </Button>
                    </div>

                    {/* Helper text */}
                    <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-4">
                        {t('common:participantExtraction.helperText')}
                    </p>
                </div>
            </Card>
        </div>
    );
};
