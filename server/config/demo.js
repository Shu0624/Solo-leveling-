// Central switch for demo/sample data.
//
// Several dashboards synthesize academic and placement metrics (CGPA,
// attendance, package predictions, eligible companies, certifications) from a
// hash of the student id when no real data exists. That is useful for demos
// but must never be presented as real data in production.
//
// Resolution order:
//   1. explicit DEMO_MODE env ('true' / 'false')
//   2. otherwise: on outside production, off in production
export const isDemoMode = () => {
  if (process.env.DEMO_MODE === 'true') return true;
  if (process.env.DEMO_MODE === 'false') return false;
  return process.env.NODE_ENV !== 'production';
};

export default isDemoMode;
