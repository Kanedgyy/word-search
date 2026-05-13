'use client';

/**
 * Skeleton loader для анимации загрузки
 * Используется для улучшения UX при загрузке данных
 */

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

/**
 * Базовый skeleton элемент
 */
export function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  return (
    <motion.div
      className={`skeleton ${variant} ${className}`}
      animate={{
        opacity: [0.4, 0.8, 0.4],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton для игрового поля
 */
export function GameBoardSkeleton() {
  return (
    <div className="grid grid-cols-10 gap-1 w-full max-w-md mx-auto" role="status" aria-label="Загрузка игрового поля">
      {Array.from({ length: 100 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-lg" variant="rectangular" />
      ))}
      <span className="sr-only">Загрузка игрового поля...</span>
    </div>
  );
}

/**
 * Skeleton для списка слов
 */
export function WordListSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Загрузка списка слов">
      <Skeleton className="h-6 w-32 mb-4" variant="text" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" variant="rectangular" />
        ))}
      </div>
      <span className="sr-only">Загрузка списка слов...</span>
    </div>
  );
}

/**
 * Skeleton для списка игроков
 */
export function PlayerListSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Загрузка списка игроков">
      <Skeleton className="h-6 w-24 mb-4" variant="text" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" variant="circular" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" variant="text" />
              <Skeleton className="h-3 w-16" variant="text" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Загрузка списка игроков...</span>
    </div>
  );
}

/**
 * Skeleton для страницы
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-48 mx-auto mb-8" variant="text" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <Skeleton className="h-6 w-32 mb-4" variant="text" />
            <Skeleton className="h-12 w-full mb-3" variant="rectangular" />
            <Skeleton className="h-12 w-full" variant="rectangular" />
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <Skeleton className="h-6 w-32 mb-4" variant="text" />
            <Skeleton className="h-12 w-full mb-3" variant="rectangular" />
            <Skeleton className="h-12 w-full" variant="rectangular" />
          </div>
        </div>
        <span className="sr-only">Загрузка страницы...</span>
      </div>
    </div>
  );
}
