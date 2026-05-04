import React, { useState } from 'react';
import CompetencyBlock from './CompetencyBlock';

const competencyList = [
    { key: 'technicalSkills', letter: 'A', title: 'Technical Skills', description: 'Quality, accuracy, and efficiency of work. Meets deadlines. Applies role-specific knowledge.' },
    { key: 'communication', letter: 'B', title: 'Communication', description: 'Effectively shares ideas and information. Active listening. Professionalism in all channels.' },
    { key: 'leadership', letter: 'C', title: 'Leadership & Initiative', description: 'Takes ownership. Self-motivated. Guides and supports others to achieve goals.' },
    { key: 'growthLearning', letter: 'D', title: 'Growth & Learning', description: 'Adaptability. Receptive to feedback. Continuous improvement and upskilling.' },
    { key: 'culture', letter: 'E', title: 'Culture & Collaboration', description: 'Alignment with values. Positive contribution to the team environment. Reliable collaborator.' }
];

function CompetenciesWrap({ data, onChange }) {
    const [subStep, setSubStep] = useState(0);
    
    const current = competencyList[subStep];

    const handleCompChange = (compData) => {
        onChange({ ...data, [current.key]: compData });
    };

    return (
        <div className="competencies-stack">
            <div className="step-indicator-sub">
                {competencyList.map((c, i) => (
                    <div key={c.key} className={`s-dot ${i === subStep ? 'active' : ''} ${i < subStep ? 'done' : ''}`} />
                ))}
            </div>

            <CompetencyBlock 
                letter={current.letter}
                title={current.title}
                description={current.description}
                data={data?.[current.key]}
                onChange={handleCompChange}
            />

            <div className="comp-nav">
                <button 
                  className="btn btn-ghost" 
                  disabled={subStep === 0} 
                  onClick={() => setSubStep(s => s - 1)}
                >
                    ← Previous Area
                </button>
                <div className="substep-text">Area {subStep + 1} of 5</div>
                <button 
                  className="btn btn-brand" 
                  disabled={subStep === competencyList.length - 1}
                  onClick={() => setSubStep(s => s + 1)}
                >
                    Next Area →
                </button>
            </div>
        </div>
    );
}

export default CompetenciesWrap;
