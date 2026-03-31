import type { Timeline, TimelineMetric } from '../../types';
import styles from './TimelineCard.module.css';

const TIMELINE_COLORS = [
    'var(--timeline-color-1)',
    'var(--timeline-color-2)',
    'var(--timeline-color-3)',
    'var(--timeline-color-4)',
    'var(--timeline-color-5)',
];

interface TimelineCardProps {
    timeline: Timeline;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
}

export default function TimelineCard({ timeline, index, isSelected, onSelect }: TimelineCardProps) {
    const color = TIMELINE_COLORS[index % TIMELINE_COLORS.length];

    const renderMetric = (name: string, metric: TimelineMetric) => {
        const trendIcon = metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→';
        const trendClass = metric.trend === 'up' ? styles.trendUp : metric.trend === 'down' ? styles.trendDown : styles.trendStable;

        return (
            <div className={styles.metric} key={name}>
                <div className={styles.metricHeader}>
                    <span className={styles.metricName}>{name}</span>
                    <span className={`${styles.metricTrend} ${trendClass}`}>{trendIcon}</span>
                </div>
                <div className={styles.metricBar}>
                    <div
                        className={styles.metricFill}
                        style={{
                            width: `${metric.score}%`,
                            backgroundColor: color
                        }}
                    />
                </div>
                <span className={styles.metricScore}>{metric.score}</span>
            </div>
        );
    };

    return (
        <div
            className={`${styles.card} ${isSelected ? styles.selected : ''}`}
            style={{
                '--accent-color': color,
                animationDelay: `${index * 0.5}s`
            } as React.CSSProperties}
            onClick={onSelect}
        >
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <h3 className={styles.title}>{timeline.title}</h3>
                    <div className={styles.probability}>
                        {timeline.probability}%
                    </div>
                </div>
                <p className={styles.summary}>{timeline.summary}</p>
            </div>

            {/* Metrics */}
            <div className={styles.metrics}>
                {renderMetric('Emotional', timeline.metrics.emotional)}
                {renderMetric('Financial', timeline.metrics.financial)}
                {renderMetric('Career', timeline.metrics.career)}
                {renderMetric('Relationships', timeline.metrics.relationships)}
                {renderMetric('Risk', timeline.metrics.risk)}
            </div>

            {/* Events Timeline by r i t i k raj*/}
            <div className={styles.events}>
                <h4>Key Events</h4>
                <div className={styles.eventsList}>
                    {timeline.events.slice(0, 4).map((event, i) => (
                        <div key={event.id || i} className={styles.event}>
                            <div
                                className={`${styles.eventMarker} ${styles[event.impact]}`}
                            />
                            <div className={styles.eventContent}>
                                <span className={styles.eventPeriod}>{event.period}</span>
                                <p className={styles.eventDescription}>{event.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trade-offs */}
            {timeline.tradeoffs.length > 0 && (
                <div className={styles.tradeoffs}>
                    <h4>Trade-offs</h4>
                    <ul>
                        {timeline.tradeoffs.slice(0, 3).map((tradeoff, i) => (
                            <li key={i}>{tradeoff}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Second Order Effects */}
            {timeline.secondOrderEffects.length > 0 && (
                <div className={styles.effects}>
                    <h4>Second-Order Effects</h4>
                    <ul>
                        {timeline.secondOrderEffects.slice(0, 2).map((effect, i) => (
                            <li key={i}>{effect}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Selection Indicator */}
            <div className={styles.selectIndicator}>
                {isSelected ? '✓ Selected' : 'Click to select'}
            </div>
        </div>
    );
}
