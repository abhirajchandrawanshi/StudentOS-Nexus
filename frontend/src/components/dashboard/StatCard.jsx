const StatCard = ({ title, value, subtitle }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

      <h3 className="text-slate-400 text-sm mb-2">
        {title}
      </h3>

      <h2 className="text-3xl font-bold text-white">
        {value}
      </h2>

      <p className="text-slate-500 mt-2 text-sm">
        {subtitle}
      </p>

    </div>
  );
};

export default StatCard;