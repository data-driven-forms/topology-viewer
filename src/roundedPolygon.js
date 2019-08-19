const roundedPolygon = (L, R) => {
  const padding = 0;
  const N = 6;
  const half = (N - 2) * Math.PI / N / 2; // Half angle of corner
  const sin = Math.sin(half);
  const cos = Math.cos(half);
  const gap = L - 2 / Math.tan(half) * R;
  const round = 2 * cos * R;
  let D = L / cos; // Diameter cross the polygon
  let offsetY = 0;

  // Diameter is different for odd-sided polygon
  if (N % 2) {
    let vertial = D / 2 + D / 2 * sin;
    D = Math.sqrt(Math.pow(L / 2, 2) + Math.pow(vertial, 2));
    offsetY = (D - vertial) / 2;
  }

  D += 2 * padding;

  const getQuadrant = x =>Math.floor(((x + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 2)) + 1;

  const points = [ [ 0, R / sin - R * sin + padding + offsetY  ] ];
  const angles = [ half - Math.PI / 2 ];
  let horizontalCut = 0;

  for (let i = 1; i <= N; i += 1) {
    const prev = angles[i - 1];
    const next = prev + Math.PI - 2 * half;
    const middle = (prev + next) / 2;

    const prevQ = getQuadrant(prev);
    const nextQ = getQuadrant(next);

    // Rounded corner reduce the horizontal size of image
    if (prevQ === 1 && nextQ >= 2 && nextQ <= 3) {
      horizontalCut = Math.cos(Math.abs(middle - Math.PI / 2)) * R / sin - R;
    }

    angles.push(next);
    points.push([ Math.cos(middle) * round, Math.sin(middle) * round  ]);
    if (i !== N) {
      points.push([ Math.cos(next) * gap, Math.sin(next) * gap  ]);
    }
  }

  // Rounded corner reduce the vertical size of image
  const vertialCut = R / sin - R;

  // Just recalculate the cords of start point
  if (N % 2) {
    D -= horizontalCut * 2;
    points[0][1] -= (horizontalCut * 2 + vertialCut) / 2;
  } else {
    D -= vertialCut * 2;
    points[0][1] -= vertialCut;
  }

  points[0][0] = D / 2 - cos * R;

  // Let the width be an integer
  const width = Math.ceil(D);
  const delta = (width - D) / 2;
  points[0][0] += delta;
  points[0][1] += delta;

  const fixFloat = value => {
    let fixed = +value.toPrecision(14);
    if (Math.abs(fixed) < 1e-13) {
      fixed = 0;
    }

    return fixed;
  };

  const list = points.map(function(p, index){
    let x = fixFloat(p[0]);
    let y = fixFloat(p[1]);
    if (index === 0) {
      return `M${x + 2} ${2 + y}`;
    } else if (index % 2) {
      return `a${R} ${R} 0 0 1 ${x} ${y}`;
    } else {
      return `l ${x} ${y}`;
    }
  });
  list.push(`l${points[2][0]} -${points[2][1]}`);
  const path = list.join('');

  return { width, height: width, path };
}

export default roundedPolygon;
