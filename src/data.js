export const nodes = [
  {
    id: 3,
    title: 'Yang',
    group: 1,
    level: 0,
    nodeType: 'source',
  },
  {
    id: 4,
    title: 'Gray',
    group: 1,
    level: 0,
    nodeType: 'source',
  },
  {
    id: 5,
    title: 'Maddox',
    group: 1,
    level: 1,
    nodeType: 'source',
  },
  {
    id: 0,
    title: 'Levy',
    group: 1,
    level: 1,
    nodeType: 'vm',
  },
  {
    id: 1,
    title: 'Celina',
    group: 1,
    level: 1,
    nodeType: 'network',
  },
  {
    id: 2,
    title: 'Nancy',
    group: 1,
    level: 1,
    nodeType: 'vm',
  }, {
    id: 11,
    title: 'Group 2 node 1',
    group: 2,
    nodeType: 'vm',
  }, {
    id: 12,
    title: 'Group 2 node 2',
    group: 2,
    nodeType: 'vm',
  }, {
    id: 13,
    title: 'Group 2 node 3',
    group: 2,
    nodeType: 'vm',
  },
];
export const edges = [
  {
    source: 1,
    target: 11,
    id: '1-11',
  },
  {
    source: 11,
    target: 12,
    id: '1-12',
  },
  {
    source: 11,
    target: 13,
    id: '1-13',
  },
  {
    source: 1,
    target: 4,
    id: '1-4',
  },
  {
    source: 2,
    target: 5,
    id: '2-5',
  },
  {
    source: 0,
    target: 1,
    id: '0-1',
  },
  {
    source: 0,
    target: 2,
    id: '0-2',
  },
  {
    source: 1,
    target: 3,
    id: '1-3',
  },
];
