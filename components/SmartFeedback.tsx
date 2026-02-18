
import React from 'react';
import type { EvaluationResult, CriteriaKeys, CriterionScore } from '../types';
import { CRITERIA } from '../constants';

interface SmartFeedbackProps {
  scores: EvaluationResult['scores'];
}

const SmartFeedback: React.FC<SmartFeedbackProps> = ({ scores }) => {
  const weakPoints = Object.entries(scores)
    // FIX: Cast the value from Object.entries to the correct type to resolve the TypeScript error.
    .map(([key, rawValue]) => {
      const value = rawValue as CriterionScore;
      const criterion = CRITERIA[key as CriteriaKeys];
      return {
        key: key as CriteriaKeys,
        score: value.score,
        maxScore: criterion.maxScore,
        recommendation: criterion.recommendation,
        title: criterion.title,
      };
    })
    .filter(item => item.score < item.maxScore) // Find areas with mistakes
    .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore)) // Sort by lowest percentage score
    .slice(0, 3); // Take top 3 weakest points

  if (weakPoints.length === 0) {
    return (
      <div className="text-center p-8 bg-green-50 rounded-2xl border border-green-100">
        <h3 className="text-2xl font-serif font-bold text-green-800">Отличная работа!</h3>
        <p className="text-green-700 mt-2">По всем критериям достигнут максимальный балл. Продолжайте в том же духе!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-serif font-bold text-refined-dark">Точки Роста</h3>
        <p className="text-stone-500 mt-2">Вот 3 ключевых аспекта, на которые стоит обратить внимание:</p>
      </div>
      <div className="space-y-4">
        {weakPoints.map(({ key, title, recommendation }) => (
          <div key={key} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-lg text-refined-red font-serif">{key}: {title}</h4>
            <p className="text-stone-600 mt-3 leading-relaxed">{recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartFeedback;
