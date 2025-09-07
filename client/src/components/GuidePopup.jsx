import React from 'react';
import { X, BookOpen, ArrowRight, AlertCircle, Info } from 'lucide-react';

const GuidePopup = ({ 
    isVisible, 
    onClose, 
    onViewFullGuide, 
    guideData 
}) => {
    if (!isVisible || !guideData) return null;

    const { title, icon: IconComponent, steps, useCases, importantNotes, colors } = guideData;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <div className={`${colors.iconBg} p-2 rounded-xl`}>
                            <BookOpen className={`w-8 h-8 ${colors.iconText}`} />
                        </div>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 w-10 h-10 rounded-full transition-colors duration-300 flex items-center justify-center"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* How It Works Section */}
                    <div className={`${colors.stepsBg} rounded-2xl p-6 ${colors.stepsBorder}`}>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <IconComponent className={`w-6 h-6 ${colors.iconText}`} />
                            How It Works
                        </h3>
                        <ol className="space-y-2 text-gray-700">
                            {steps.map((step, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className={`${colors.stepNumber} text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5`}>
                                        {index + 1}
                                    </span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Use Cases Section */}
                    <div className={`${colors.useCasesBg} rounded-2xl p-6 ${colors.useCasesBorder}`}>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Info className={`w-6 h-6 ${colors.useCasesIcon}`} />
                            Perfect For
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                            {useCases.map((useCase, index) => (
                                <li key={index}>• {useCase}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Important Notes Section */}
                    <div className={`${colors.notesBg} rounded-2xl p-6 ${colors.notesBorder}`}>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <AlertCircle className={`w-6 h-6 ${colors.notesIcon}`} />
                            Important Notes
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                            {importantNotes.map((note, index) => (
                                <li key={index}>• {note}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={onViewFullGuide}
                            className={`flex-1 ${colors.primaryButton} text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2`}
                        >
                            <ArrowRight className="w-5 h-5" />
                            View Full Guide
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-bold"
                        >
                            Got It!
                        </button>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #14b8a6, #0d9488);
                    border-radius: 10px;
                    border: 1px solid #0f766e;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, #0d9488, #0f766e);
                }
                
                /* Firefox scrollbar */
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #14b8a6 #f1f5f9;
                }
            `}</style>
        </div>
    );
};

export default GuidePopup;