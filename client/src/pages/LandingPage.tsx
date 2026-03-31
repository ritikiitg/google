import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';

export default function LandingPage() {
    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <img src="/icon.png" alt="Usaid" className={styles.heroLogo} />
                    <div className={styles.badge}>✨ AI-Powered Decision Making</div>
                    <h1 className={styles.title}>
                        Experience the <span className={styles.gradient}>Future</span>
                        <br />Before You Choose It
                    </h1>
                    <p className={styles.subtitle}>
                        Usaid simulates multiple future timelines for your life decisions,
                        helping you understand long-term consequences before committing.
                    </p>
                    <div className={styles.cta}>
                        <Link to="/auth" className="btn btn-primary btn-lg">
                            Start Exploring Futures
                        </Link>
                        <Link to="/auth?mode=login" className="btn btn-secondary btn-lg">
                            Sign In
                        </Link>
                    </div>
                </div>

                {/* Animated background elements */}
                <div className={styles.heroBackground}>
                    <div className={styles.orb1}></div>
                    <div className={styles.orb2}></div>
                    <div className={styles.orb3}></div>
                </div>
            </section>

            {/* Features Section by ritik raj*/}
            <section className={styles.features}>
                <h2 className={styles.sectionTitle}>How It Works</h2>
                <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>💭</div>
                        <h3>Describe Your Decision</h3>
                        <p>Enter any life decision in natural language — career moves, relocations, relationships, investments.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>🌳</div>
                        <h3>Explore Timelines</h3>
                        <p>AI generates 3-5 distinct future scenarios with different outcomes, trade-offs, and probabilities.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>📊</div>
                        <h3>Compare Outcomes</h3>
                        <p>View metrics for emotional state, finances, career, relationships, and risk across all timelines.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>🔄</div>
                        <h3>Inject New Decisions</h3>
                        <p>What if you made a follow-up decision? Add new choices and watch timelines update instantly.</p>
                    </div>
                </div>
            </section>

            {/* Demo Preview */}
            <section className={styles.demo}>
                <div className={styles.demoContent}>
                    <h2>See Your Possible Futures</h2>
                    <p>Each timeline shows key events, second-order effects, and quantified metrics to help you make informed decisions.</p>

                    <div className={styles.demoTimelines}>
                        <div className={styles.demoTimeline} style={{ borderColor: 'var(--timeline-color-1)' }}>
                            <h4>🚀 The Bold Leap</h4>
                            <p>Quit your job and launch the startup. High risk, potentially transformative.</p>
                            <div className={styles.demoMetrics}>
                                <span>Probability: 25%</span>
                                <span>Risk: High</span>
                            </div>
                        </div>
                        <div className={styles.demoTimeline} style={{ borderColor: 'var(--timeline-color-2)' }}>
                            <h4>⚖️ The Balanced Path</h4>
                            <p>Start as a side project while staying employed. Moderate growth, lower risk.</p>
                            <div className={styles.demoMetrics}>
                                <span>Probability: 45%</span>
                                <span>Risk: Medium</span>
                            </div>
                        </div>
                        <div className={styles.demoTimeline} style={{ borderColor: 'var(--timeline-color-3)' }}>
                            <h4>🛡️ Safe Harbor</h4>
                            <p>Stay in current role, focus on internal advancement. Stable, predictable.</p>
                            <div className={styles.demoMetrics}>
                                <span>Probability: 80%</span>
                                <span>Risk: Low</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer by ritik raj*/}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerLogo}>
                        <img src="/icon.png" alt="Usaid" />
                    </div>
                    <p>Powered by Gemini 3 Flash • Built for Google AI Hackathon 2026</p>
                </div>
            </footer>
        </div>
    );
}
