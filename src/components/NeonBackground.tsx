export default function NeonBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="cyber-grid absolute inset-0" />
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-pink-500/15 blur-3xl" />
    </div>
  );
}
