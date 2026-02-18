import type { CriterionGroup, Criterion, CriteriaKeys } from './types';

export const CRITERIA: Record<CriteriaKeys, Criterion> = {
  K1: { id: 'K1', title: 'Позиция автора', maxScore: 1, color: 'red', recommendation: 'Верно сформулируйте позицию автора (рассказчика) по проблеме исходного текста.' },
  K2: { id: 'K2', title: 'Комментарий к позиции', maxScore: 3, color: 'orange', recommendation: 'Приведите 2 примера-иллюстрации, поясните их и укажите смысловую связь между ними.' },
  K3: { id: 'K3', title: 'Собственное отношение', maxScore: 2, color: 'amber', recommendation: 'Выразите свое согласие/несогласие и обоснуйте его (приведите аргумент из жизни или литературы).' },
  K4: { id: 'K4', title: 'Фактическая точность', maxScore: 1, color: 'violet', recommendation: 'Не допускайте искажения фактов в фоновом материале (имена, даты, события).' },
  K5: { id: 'K5', title: 'Логичность речи', maxScore: 2, color: 'lime', recommendation: 'Следите за логикой изложения и абзацным членением текста.' },
  K6: { id: 'K6', title: 'Этические нормы', maxScore: 1, color: 'indigo', recommendation: 'Не допускайте проявлений речевой агрессии и этических ошибок.' },
  K7: { id: 'K7', title: 'Орфографические нормы', maxScore: 3, color: 'emerald', recommendation: 'Внимательно проверяйте написание слов.' },
  K8: { id: 'K8', title: 'Пунктуационные нормы', maxScore: 3, color: 'teal', recommendation: 'Следите за знаками препинания.' },
  K9: { id: 'K9', title: 'Грамматические нормы', maxScore: 3, color: 'cyan', recommendation: 'Соблюдайте нормы словообразования, морфологии и синтаксиса.' },
  K10: { id: 'K10', title: 'Речевые нормы', maxScore: 3, color: 'sky', recommendation: 'Следите за лексической сочетаемостью и точностью словоупотребления.' },
};

export const CRITERIA_GROUPS: CriterionGroup[] = [
  {
    title: 'Содержание сочинения',
    criteria: [CRITERIA.K1, CRITERIA.K2, CRITERIA.K3],
    shortDescription: 'Позиция, комментарий, отношение',
    description: 'Оценивается понимание позиции автора, качество комментария и обоснование собственного мнения.'
  },
  {
    title: 'Речевое оформление',
    criteria: [CRITERIA.K4, CRITERIA.K5, CRITERIA.K6],
    shortDescription: 'Факты, логика, этика',
    description: 'Оценивается точность фактов, логическая связность текста и соблюдение этических норм.'
  },
  {
    title: 'Грамотность',
    criteria: [CRITERIA.K7, CRITERIA.K8, CRITERIA.K9, CRITERIA.K10],
    shortDescription: 'Орфография, пунктуация, речь',
    description: 'Оценивается соблюдение всех языковых норм (орфография, пунктуация, грамматика, речь).'
  }
];