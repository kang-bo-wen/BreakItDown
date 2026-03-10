'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  TrophyIcon,
  LightBulbIcon,
  SparklesIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
  PaintBrushIcon,
  RocketLaunchIcon,
  LockClosedIcon,
  BoltIcon,
  CubeTransparentIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

// 前后对比滑块组件
function ComparisonSlider({ before, after, alt }: { before: React.ReactNode; after: React.ReactNode; alt: string }) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  }, [isDragging]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[500px] rounded-2xl overflow-hidden cursor-ew-resize select-none"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      {/* 底层 - 完整显示 after */}
      <div className="absolute inset-0">
        {after}
      </div>

      {/* 顶层 - 用 clip-path 裁剪 before，保持图片静止 */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {before}
      </div>

      {/* 滑块竖线 */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
        style={{ left: `${position}%` }}
      >
        {/* 滑块手柄 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // 创建一个足够高的容器来实现滚动
  const containerRef = useRef<HTMLDivElement>(null);

  // 监听滚动进度
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // 视频模糊层 - 一开始清晰，随着滚动逐渐模糊
  const videoBlur = useTransform(scrollYProgress, [0, 0.25], [0, 15]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.4, 0.6], [1, 0.6, 0]);

  // 立方体三个面的拆解动画 - 先播放拆解
  // 顶面: 0.02-0.08
  const faceTopX = useTransform(scrollYProgress, [0, 0.02, 0.08, 0.12], [0, 0, 0, 0]);
  const faceTopY = useTransform(scrollYProgress, [0, 0.02, 0.08, 0.12], [0, 0, -50, -50]);
  // 左面: 0.08-0.14
  const faceLeftX = useTransform(scrollYProgress, [0, 0.08, 0.14, 0.18], [0, 0, -50, -50]);
  const faceLeftY = useTransform(scrollYProgress, [0, 0.08, 0.14, 0.18], [0, 0, 25, 25]);
  // 右面: 0.14-0.20
  const faceRightX = useTransform(scrollYProgress, [0, 0.14, 0.20, 0.24], [0, 0, 50, 50]);
  const faceRightY = useTransform(scrollYProgress, [0, 0.14, 0.20, 0.24], [0, 0, 25, 25]);

  // Logo层 - 缩放和虚化，在拆解完成后开始
  const logoScale = useTransform(scrollYProgress, [0.20, 0.25, 0.35], [1, 2.5, 3.5]);
  const logoBlur = useTransform(scrollYProgress, [0.20, 0.22, 0.35], [0, 10, 30]);
  const logoOpacity = useTransform(scrollYProgress, [0.20, 0.25, 0.35], [1, 0.5, 0]);

  // 网站名字层 - 在logo消失后出现，时间缩短
  const titleOpacity = useTransform(scrollYProgress, [0.25, 0.32, 0.45, 0.52], [0, 1, 1, 0]);
  const titleY = useTransform(scrollYProgress, [0.25, 0.32], [50, 0]);

  // 宣传语层 - 在title之后出现
  const taglineOpacity = useTransform(scrollYProgress, [0.45, 0.52, 0.95, 1], [0, 1, 1, 0]);
  const taglineY = useTransform(scrollYProgress, [0.45, 0.52], [50, 0]);

  return (
    <div ref={containerRef} className="relative">
      {/* 3D折叠容器 - 包含所有视差层 */}
      <motion.div
        className="fixed inset-0 z-40"
      >
        {/* 固定在视口的视频层 */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{
            filter: useTransform(videoBlur, (v) => `blur(${v}px)`),
            opacity: videoOpacity,
          }}
        >
          {/* TODO: 替换为用户的视频文件 */}
          { <video
            src="/videos/hero-background.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          /> }
          {/* 临时占位背景 */}
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
        </motion.div>

        {/* Logo层 - 立方体拆解动画 */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
          style={{
            scale: logoScale,
            filter: useTransform(logoBlur, (v) => `blur(${v}px)`),
            opacity: logoOpacity,
          }}
        >
          <svg viewBox="0 0 200 200" className="w-[40rem] h-[40rem]">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>

            {/* 中心立方体 - 等轴测 */}
            <g transform="translate(100, 100)">
              {/* 顶面 - 向上拆解 */}
              <motion.g
                style={{ x: faceTopX, y: faceTopY }}
              >
                <path d="M0 -50 L45 -25 L0 0 L-45 -25 Z" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" />
              </motion.g>

              {/* 右面向右下拆解 */}
              <motion.g
                style={{ x: faceRightX, y: faceRightY }}
              >
                <path d="M45 -25 L45 25 L0 50 L0 0 Z" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" />
              </motion.g>

              {/* 左面向左下拆解 */}
              <motion.g
                style={{ x: faceLeftX, y: faceLeftY }}
              >
                <path d="M-45 -25 L0 0 L0 50 L-45 25 Z" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" />
              </motion.g>
            </g>

            {/* 中心原子核 */}
            <circle cx="100" cy="100" r="5" fill="white" />
          </svg>
        </motion.div>

        {/* 网站名字层 */}
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          <div className="text-center">
            <h1 className="text-7xl md:text-9xl lg:text-[10rem] font-black tracking-wider relative">
              {/* 外层发光 */}
              <span className="absolute inset-0 text-white/30 blur-3xl" style={{ textShadow: '0 0 60px rgba(255,255,255,0.5)' }}>
                BREAK IT DOWN
              </span>
              {/* 主文字 - 渐变 + 内发光 */}
              <span className="relative bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent" style={{ textShadow: '0 0 40px rgba(255,255,255,0.8)' }}>
                BREAK IT DOWN
              </span>
            </h1>
            {/* 底部装饰线 */}
            <div className="mt-4 flex justify-center gap-2">
              <div className="h-1 w-16 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full" />
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full" />
              <div className="h-1 w-16 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* 宣传语层 - 滚动消失 */}
        <motion.div
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          style={{ opacity: taglineOpacity, y: taglineY }}
        >
          <p className="text-2xl md:text-3xl text-white/80 text-center max-w-2xl px-4">
            探索万物的本质 · 从复杂到简单的逆熵之旅
          </p>
        </motion.div>
      </motion.div>

      {/* 创建足够高的滚动区域（视差动画区域） */}
      <div className="h-[1000vh]" />

      {/* 宣传内容区域 - 滚动到这里显示 */}
      <div className="relative z-50 bg-black text-white">
        {/* 产品特性大标题 */}
        <section className="pt-20 pb-10">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              产品特性
            </h2>
            <p className="text-xl text-gray-400">探索万物的本质，从复杂到简单的逆熵之旅</p>
          </div>
        </section>

        {/* 特性介绍 1 */}
        <section className="min-h-screen flex items-center justify-center py-10">
          <div className="max-w-6xl mx-auto px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              {/* 前后对比滑块 */}
              <ComparisonSlider
                before={
                  <img src="/images/生成拍照图片.png" alt="上传图片" className="w-full h-full object-cover" />
                }
                after={
                  <img src="/images/识图.png" alt="AI识别结果" className="w-full h-full object-cover" />
                }
                alt="智能识别"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                智能识别
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                上传图片或输入文字，AI 智能识别物品类型。借助先进的计算机视觉技术，
                快速获取物品的详细信息、分类标签和简要描述。
              </p>
            </div>
          </div>
        </section>

        {/* 特性介绍 2 */}
        <section className="min-h-screen flex items-center justify-center py-20">
          <div className="max-w-6xl mx-auto px-8 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                深度拆解
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                从多个维度拆解事物本质，了解其组成部分、材料构成、
                制作工艺以及供应链上下游。让你对事物有更深入的理解。
              </p>
            </div>
            <div>
              {/* 前后对比滑块 */}
              <ComparisonSlider
                before={
                  <img src="/images/mac.png" alt="Mac电脑" className="w-full h-full object-cover" />
                }
                after={
                  <img src="/images/mac 拆解.png" alt="拆解结果" className="w-full h-full object-cover" />
                }
                alt="深度拆解"
              />
            </div>
          </div>
        </section>

        {/* 特性介绍 3 */}
        <section className="min-h-screen flex items-center justify-center py-20">
          <div className="max-w-6xl mx-auto px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              {/* 前后对比滑块 */}
              <ComparisonSlider
                before={
                  <img src="/images/文本.png" alt="文本数据" className="w-full h-full object-cover" />
                }
                after={
                  <img src="/images/可视化.png" alt="可视化展示" className="w-full h-full object-cover" />
                }
                alt="可视化展示"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                可视化展示
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                采用精美的可视化图表展示拆解结果，
                让你直观理解知识脉络。多主题皮肤适配，无论白天黑夜都能舒适浏览。
              </p>
            </div>
          </div>
        </section>

        {/* 应用场景 */}
        <section className="min-h-screen flex items-center justify-center py-20">
          <div className="max-w-6xl mx-auto px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400">
                应用场景
              </h2>
              <p className="text-xl text-gray-400">探索万物的本质，从复杂到简单的逆熵之旅</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-green-500 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mb-5 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">教育学习</h3>
                <p className="text-gray-400 leading-relaxed">
                  帮助学生理解物品的构成，将复杂的物体拆解为简单的组成部分，让学习更加直观有趣。
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-purple-500 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">产品设计</h3>
                <p className="text-gray-400 leading-relaxed">
                  分析竞品的材料组成，了解产品的内部结构和原材料来源，为产品设计提供参考。
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">环保意识</h3>
                <p className="text-gray-400 leading-relaxed">
                  了解产品的原材料来源和生产过程，增强环保意识，促进可持续消费。
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 mb-5 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">趣味探索</h3>
                <p className="text-gray-400 leading-relaxed">
                  探索日常物品的内在世界，满足好奇心，带来意想不到的知识收获。
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 关于我们 */}
        <section className="min-h-screen flex items-center justify-center py-20">
          <div className="max-w-6xl mx-auto px-8">
            {/* 标题 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                关于我们
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                探索万物的本质，从复杂到简单的逆熵之旅
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* 项目简介 */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20"
              >
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <TrophyIcon className="w-7 h-7 text-blue-400" />
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">项目简介</span>
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Break It Down 是一个创新的交互式可视化项目，旨在通过 AI 技术帮助用户理解复杂物体的构成。
                  我们将任何物体逐层拆解，直至最基本的原材料，让您以全新的视角认识身边的事物。
                </p>
              </motion.div>

              {/* 核心理念 */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20"
              >
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <LightBulbIcon className="w-7 h-7 text-purple-400" />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">核心理念</span>
                </h3>
                <div className="space-y-3 text-gray-300">
                  <p>
                    <strong className="text-white">熵逆转</strong> —
，熵代表                    在物理学中系统的混乱程度。我们的项目反其道而行之，
                    将复杂的成品"逆向"拆解为简单的原材料，让混乱回归有序。
                  </p>
                  <p>
                    这不仅是一个技术展示，更是一种思维方式：
                    <strong className="text-purple-300">从复杂到简单，从表象到本质</strong>。
                  </p>
                </div>
              </motion.div>
            </div>

            {/* 功能特性 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-12 border border-white/20"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <SparklesIcon className="w-7 h-7 text-cyan-400" />
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">功能特性</span>
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-black/30 rounded-lg p-6">
                  <PhotoIcon className="w-10 h-10 text-cyan-400" />
                  <h4 className="text-xl font-semibold mb-2 text-white">AI 图片识别</h4>
                  <p className="text-sm text-gray-400">
                    上传图片，AI 自动识别物体类型和名称
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-6">
                  <MagnifyingGlassIcon className="w-10 h-10 text-cyan-400" />
                  <h4 className="text-xl font-semibold mb-2 text-white">递归拆解</h4>
                  <p className="text-sm text-gray-400">
                    逐层拆解物体，直至最基本的原材料
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-6">
                  <CubeIcon className="w-10 h-10 text-cyan-400" />
                  <h4 className="text-xl font-semibold mb-2 text-white">交互式可视化</h4>
                  <p className="text-sm text-gray-400">
                    树状图展示，支持拖拽、缩放、查看详情
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 技术栈和使用场景 */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* 技术栈 */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20"
              >
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <WrenchScrewdriverIcon className="w-7 h-7 text-orange-400" />
                  <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">技术栈</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-black/30 rounded-lg p-4">
                    <CpuChipIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-white">Next.js 15</div>
                      <div className="text-xs text-gray-400">前端框架</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-black/30 rounded-lg p-4">
                    <CpuChipIcon className="w-8 h-8 text-purple-400" />
                    <div>
                      <div className="font-semibold text-white">AI 大模型</div>
                      <div className="text-xs text-gray-400">智能识别</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-black/30 rounded-lg p-4">
                    <PaintBrushIcon className="w-8 h-8 text-pink-400" />
                    <div>
                      <div className="font-semibold text-white">React Flow</div>
                      <div className="text-xs text-gray-400">图形可视化</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-black/30 rounded-lg p-4">
                    <span className="text-2xl">✨</span>
                    <div>
                      <div className="font-semibold text-white">Framer</div>
                      <div className="text-xs text-gray-400">动画效果</div>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* CTA 按钮区域 - 在最底部 */}
        <section className="min-h-[50vh] flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-8">
              准备好探索了吗？
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto">
              从今天开始，用 AI 帮你拆解万物的本质
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {status === 'authenticated' ? (
                <button
                  className="px-12 py-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  onClick={() => {
                    localStorage.removeItem('deconstructionTree');
                    localStorage.removeItem('identificationResult');
                    localStorage.removeItem('imagePreview');
                    localStorage.removeItem('knowledgeCache');
                    localStorage.removeItem('nodePositions');
                    localStorage.removeItem('humorLevel');
                    localStorage.removeItem('professionalLevel');
                    localStorage.removeItem('promptMode');
                    localStorage.removeItem('customPrompt');
                    localStorage.removeItem('setupState');
                    localStorage.removeItem('fromSetup');
                    router.push('/setup');
                  }}
                >
                  <RocketLaunchIcon className="w-5 h-5 mr-2" />新建拆解
                </button>
              ) : (
                <button
                  className="px-12 py-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  onClick={() => router.push('/login')}
                >
                  <LockClosedIcon className="w-5 h-5 mr-2" />登录 / 注册
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 底部 */}
        <footer className="py-8 text-center text-gray-500 border-t border-white/10">
          <p>Powered by AI · Next.js · React Flow</p>
        </footer>
      </div>
    </div>
  );
}
