import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, icon: Icon, color = 'amber', trend, subtitle }) {
  const colorClasses = {
    amber: 'from-amber-400 to-yellow-500 text-amber-600 bg-amber-50',
    green: 'from-green-400 to-emerald-500 text-green-600 bg-green-50',
    blue: 'from-blue-400 to-indigo-500 text-blue-600 bg-blue-50',
    red: 'from-red-400 to-rose-500 text-red-600 bg-red-50',
    purple: 'from-purple-400 to-violet-500 text-purple-600 bg-purple-50',
  };

  const gradientClass = colorClasses[color]?.split(' ')[0] + ' ' + colorClasses[color]?.split(' ')[1];
  const textClass = colorClasses[color]?.split(' ')[2];
  const bgClass = colorClasses[color]?.split(' ')[3];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm font-medium mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% ce mois
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}