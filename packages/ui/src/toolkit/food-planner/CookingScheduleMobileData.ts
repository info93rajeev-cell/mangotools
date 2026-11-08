export interface MobileScheduleTask {
  id: string;
  name: string;
  time: string;
  duration: string;
  recipe: string;
  priority: 'High' | 'Medium';
  isDone: boolean;
}

export interface MobileStageGroup {
  name: string;
  count: number;
  time: string;
  icon: string;
  tasks: MobileScheduleTask[];
}

export const STATIC_MOBILE_STAGE_GROUPS: MobileStageGroup[] = [
  {
    name: 'Early Prep',
    count: 2,
    time: '45 min',
    icon: 'leaf',
    tasks: [
      {
        id: 't1',
        name: 'Chop Vegetables',
        time: '08:00 AM',
        duration: '25 min',
        recipe: 'Multiple Dishes',
        priority: 'High',
        isDone: true,
      },
      {
        id: 't2',
        name: 'Roast Ingredients',
        time: '08:25 AM',
        duration: '20 min',
        recipe: 'Besan Ladoo',
        priority: 'Medium',
        isDone: true,
      },
    ],
  },
  {
    name: 'Dough & Soaking',
    count: 1,
    time: '30 min',
    icon: 'coffee',
    tasks: [
      {
        id: 't3',
        name: 'Knead mathri dough & rest',
        time: '08:45 AM',
        duration: '30 min',
        recipe: 'Mathri',
        priority: 'Medium',
        isDone: false,
      },
    ],
  },
  {
    name: 'Cooking',
    count: 2,
    time: '1 hr 30 min',
    icon: 'flame',
    tasks: [
      {
        id: 't4',
        name: 'Prepare Shahi Paneer gravy',
        time: '10:00 AM',
        duration: '60 min',
        recipe: 'Shahi Paneer',
        priority: 'High',
        isDone: false,
      },
      {
        id: 't5',
        name: 'Cook Jeera Rice',
        time: '11:00 AM',
        duration: '30 min',
        recipe: 'Jeera Rice',
        priority: 'Medium',
        isDone: false,
      },
    ],
  },
  {
    name: 'Frying',
    count: 2,
    time: '1 hr',
    icon: 'shield',
    tasks: [
      {
        id: 't6',
        name: 'Roll, cut & fry mathri',
        time: '01:00 PM',
        duration: '60 min',
        recipe: 'Mathri',
        priority: 'High',
        isDone: false,
      },
      {
        id: 't7',
        name: 'Prepare tempering & cook raita',
        time: '02:00 PM',
        duration: '30 min',
        recipe: 'Raita',
        priority: 'Medium',
        isDone: false,
      },
    ],
  },
  {
    name: 'Final Assembly / Serving',
    count: 1,
    time: '20 min',
    icon: 'check-circle',
    tasks: [
      {
        id: 't8',
        name: 'Final plating & serving setup',
        time: '04:30 PM',
        duration: '20 min',
        recipe: 'All Recipes',
        priority: 'High',
        isDone: false,
      },
    ],
  },
];
