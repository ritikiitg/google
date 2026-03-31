import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDecisionStore } from '../stores/decisionStore';
import { useSound } from '../context/SoundContext';
import TimelineCard from '../components/timeline/TimelineCard';
import TimelineComparison from '../components/timeline/TimelineComparison';
import type { Timeline } from '../types';
import styles from './DecisionPage.module.css';

const RETHINKING_MESSAGES = [
    '🔄 Re-analyzing your scenario...',
    '🌀 Re-generating possibilities...',
    '🧠 Re-thinking outcomes...',
    '⚡ Processing new timelines...',
    '🔮 Exploring alternate futures...',
    '📊 Recalculating probabilities...',
];

function InjectThinkingIndicator() {
    const [elapsed, setElapsed] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);

        const messageTimer = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % RETHINKING_MESSAGES.length);
        }, 2000);

        return () => {
            clearInterval(timer);
            clearInterval(messageTimer);
        };
    }, []);

    return (
        <div className={styles.injectThinking}>
            <div className={styles.thinkingHeader}>
                <div className={styles.thinkingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span className={styles.thinkingTime}>Re-thinking for {elapsed}s</span>
            </div>
            <p className={styles.thinkingMessage}>{RETHINKING_MESSAGES[messageIndex]}</p>
        </div>
    );
}

export default function DecisionPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentDecision, isLoading, isGenerating, error, fetchDecision, injectDecision } = useDecisionStore();
    const { playSound } = useSound();

    const [selectedTimelines, setSelectedTimelines] = useState<string[]>([]);
    const [showComparison, setShowComparison] = useState(false);
    const [injectMode, setInjectMode] = useState(false);
    const [newDecision, setNewDecision] = useState('');
    const [selectedForInject, setSelectedForInject] = useState<string | null>(null);
    const wasLoading = useRef(false);

    useEffect(() => {
        if (id) {
            fetchDecision(id);
        }
    }, [id, fetchDecision]);

    useEffect(() => {
        if (wasLoading.current && !isLoading && currentDecision?.timelines && currentDecision.timelines.length > 0) {
            playSound('received');
        }
        wasLoading.current = isLoading;
    }, [isLoading, currentDecision?.timelines, playSound]);

    const handleTimelineSelect = (timelineId: string) => {
        playSound('click');
        setSelectedTimelines(prev => {
            if (prev.includes(timelineId)) {
                return prev.filter(t => t !== timelineId);
            }
            if (prev.length < 3) {
                return [...prev, timelineId];
            }
            return prev;
        });
    };

    const handleCompare = () => {
        if (selectedTimelines.length >= 2) {
            setShowComparison(true);
        }
    };

    const handleInjectDecision = async () => {
        if (!id || !selectedForInject || !newDecision.trim() || isGenerating) return;

        // Play send sound
        playSound('send');

        try {
            const result = await injectDecision(id, selectedForInject, newDecision.trim());
            navigate(`/decision/${result.decision.id}`);
        } catch {
        }
    };

    const handleInjectKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleInjectDecision();
        }
    };

    const getSelectedTimelinesData = (): Timeline[] => {
        if (!currentDecision?.timelines) return [];
        return selectedTimelines
            .map(id => currentDecision.timelines!.find(t => t.id === id))
            .filter((t): t is Timeline => t !== undefined);
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading decision...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.error}>
                <p>{error}</p>
                <button onClick={() => { playSound('click'); navigate('/dashboard'); }} className="btn btn-primary">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!currentDecision) {
        return null;
    }

    return (
        <div className={styles.container}>
            {/* Decision Header by ritik raj*/}
            <header className={styles.header}>
                <button onClick={() => { playSound('click'); navigate('/dashboard'); }} className={styles.backButton}>
                    ← Back
                </button>
                <div className={styles.decisionInfo}>
                    {currentDecision.category && (
                        <span className={styles.category}>{currentDecision.category}</span>
                    )}
                    <h1>{currentDecision.content}</h1>
                </div>
            </header>

            {/* Actions Bar */}
            <div className={styles.actions}>
                <div className={styles.selectionInfo}>
                    {selectedTimelines.length > 0 && (
                        <span>{selectedTimelines.length} selected</span>
                    )}
                </div>
                <div className={styles.actionButtons}>
                    <button
                        onClick={() => { playSound('click'); handleCompare(); }}
                        className="btn btn-secondary"
                        disabled={selectedTimelines.length < 2}
                    >
                        Compare ({selectedTimelines.length}/3)
                    </button>
                    <button
                        onClick={() => { playSound('click'); setInjectMode(!injectMode); }}
                        className={`btn ${injectMode ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        {injectMode ? 'Cancel' : '+ Add Follow-up Decision'}
                    </button>
                </div>
            </div>

            {/* Inject Decision Panel by ritik raj*/}
            {injectMode && (
                <div className={styles.injectPanel}>
                    <h3>What's your follow-up decision?</h3>
                    <p>Select a timeline and add a new decision to see how it affects the future.</p>

                    <div className={styles.injectForm}>
                        <select
                            className="input"
                            value={selectedForInject || ''}
                            onChange={(e) => { playSound('click'); setSelectedForInject(e.target.value); }}
                            disabled={isGenerating}
                        >
                            <option value="">Select a timeline to branch from...</option>
                            {currentDecision.timelines?.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>

                        <textarea
                            className="input textarea"
                            placeholder="What if I also..."
                            value={newDecision}
                            onChange={(e) => setNewDecision(e.target.value)}
                            onKeyDown={handleInjectKeyDown}
                            disabled={isGenerating}
                            rows={3}
                        />

                        {/* Re-thinking Indicator */}
                        {isGenerating && <InjectThinkingIndicator />}

                        <button
                            onClick={handleInjectDecision}
                            className="btn btn-primary"
                            disabled={!selectedForInject || !newDecision.trim() || isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    Re-generating...
                                </>
                            ) : (
                                'Generate New Timelines'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Comparison Modal */}
            {showComparison && (
                <TimelineComparison
                    timelines={getSelectedTimelinesData()}
                    onClose={() => setShowComparison(false)}
                />
            )}

            {/* Timelines Grid */}
            <div className={styles.timelinesGrid}>
                {currentDecision.timelines?.map((timeline, index) => (
                    <TimelineCard
                        key={timeline.id}
                        timeline={timeline}
                        index={index}
                        isSelected={selectedTimelines.includes(timeline.id)}
                        onSelect={() => handleTimelineSelect(timeline.id)}
                    />
                ))}
            </div>
        </div>
    );
}
