const SectionHeader = ({ title }: { title: string }) => {
  return (
    <h2 className="font-display text-[10px] uppercase mb-3 ml-1 text-arcane-gold-light tracking-widest">
      {title}
    </h2>
  );
};

export default SectionHeader;
