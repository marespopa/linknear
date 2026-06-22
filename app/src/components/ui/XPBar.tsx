const XPBar = ({ percent }: { percent: number }) => {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="w-full h-2 bg-black border border-arcane-navy rounded-full overflow-hidden">
      <div
        className="h-full bg-arcane-gold transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

export default XPBar;
