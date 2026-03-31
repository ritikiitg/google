import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import styles from './ProfilePage.module.css';

const PRIORITIES = [
    'Career Growth',
    'Financial Security',
    'Work-Life Balance',
    'Family & Relationships',
    'Health & Wellness',
    'Personal Development',
    'Adventure & Travel',
    'Creative Fulfillment',
    'Social Impact',
    'Stability',
];

export default function ProfilePage() {
    const { user, updateProfile, isLoading, error, clearError } = useAuthStore();

    const [name, setName] = useState(user?.name || '');
    const [riskTolerance, setRiskTolerance] = useState(user?.riskTolerance || 'medium');
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>(user?.priorities || []);
    const [currentSituation, setCurrentSituation] = useState(user?.currentSituation || '');
    const [saved, setSaved] = useState(false);

    const togglePriority = (priority: string) => {
        setSelectedPriorities(prev => {
            if (prev.includes(priority)) {
                return prev.filter(p => p !== priority);
            }
            if (prev.length < 5) {
                return [...prev, priority];
            }
            return prev;
        });
        clearError();
        setSaved(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile({
                name: name || undefined,
                riskTolerance: riskTolerance as 'low' | 'medium' | 'high',
                priorities: selectedPriorities,
                currentSituation: currentSituation || undefined,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            // Error handled by store
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Your Profile</h1>
                <p>Help the AI understand you better for more accurate simulations.</p>
            </header>

            {error && <div className={styles.error}>{error}</div>}
            {saved && <div className={styles.success}>Profile saved successfully!</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Basic Info */}
                <section className={styles.section}>
                    <h2>Basic Information</h2>
                    <div className={styles.field}>
                        <label htmlFor="name">Display Name</label>
                        <input
                            id="name"
                            type="text"
                            className="input"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setSaved(false); }}
                        />
                    </div>
                </section>

                {/* Risk Tolerance */}
                <section className={styles.section}>
                    <h2>Risk Tolerance</h2>
                    <p>How comfortable are you with uncertainty and potential downsides?</p>
                    <div className={styles.riskOptions}>
                        {(['low', 'medium', 'high'] as const).map((level) => (
                            <button
                                key={level}
                                type="button"
                                className={`${styles.riskOption} ${riskTolerance === level ? styles.selected : ''}`}
                                onClick={() => { setRiskTolerance(level); setSaved(false); }}
                            >
                                <span className={styles.riskIcon}>
                                    {level === 'low' ? '🛡️' : level === 'medium' ? '⚖️' : '🚀'}
                                </span>
                                <span className={styles.riskLabel}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                                <span className={styles.riskDesc}>
                                    {level === 'low' && 'Prefer stability and predictable outcomes'}
                                    {level === 'medium' && 'Balanced approach to risk and reward'}
                                    {level === 'high' && 'Comfortable with uncertainty for bigger gains'}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Priorities by ritik raj*/}
                <section className={styles.section}>
                    <h2>Life Priorities</h2>
                    <p>Select up to 5 areas that matter most to you.</p>
                    <div className={styles.priorityGrid}>
                        {PRIORITIES.map((priority) => (
                            <button
                                key={priority}
                                type="button"
                                className={`${styles.priority} ${selectedPriorities.includes(priority) ? styles.selected : ''}`}
                                onClick={() => togglePriority(priority)}
                            >
                                {priority}
                                {selectedPriorities.includes(priority) && <span className={styles.checkmark}>✓</span>}
                            </button>
                        ))}
                    </div>
                    <span className={styles.counter}>{selectedPriorities.length}/5 selected</span>
                </section>

                {/* Current Situation by ritik raj*/}
                <section className={styles.section}>
                    <h2>Current Situation</h2>
                    <p>Briefly describe your current life context (optional but helps AI give better simulations).</p>
                    <textarea
                        className="input textarea"
                        placeholder="e.g., I'm a 28-year-old software engineer in a stable job, considering a career switch. I have some savings but also student loans..."
                        value={currentSituation}
                        onChange={(e) => { setCurrentSituation(e.target.value); setSaved(false); }}
                        rows={4}
                    />
                </section>

                <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Profile'}
                </button>
            </form>
        </div>
    );
}
