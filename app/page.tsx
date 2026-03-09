'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
      className="relative w-full h-80 rounded-2xl overflow-hidden cursor-ew-resize select-none"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      {/* 底层 - 右边（after） */}
      <div className="absolute inset-0">
        {after}
      </div>

      {/* 顶层 - 左边（before），被裁剪 */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
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

  // 视频模糊层 - 模糊程度随滚动减少
  const videoBlur = useTransform(scrollYProgress, [0, 0.08], [20, 0]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.08, 0.15], [1, 0.5, 0]);

  // Logo层 - 缩放和虚化
  const logoScale = useTransform(scrollYProgress, [0, 0.1, 0.15], [1, 2.5, 3]);
  const logoBlur = useTransform(scrollYProgress, [0, 0.08, 0.15], [0, 10, 30]);
  const logoOpacity = useTransform(scrollYProgress, [0, 0.1, 0.15], [1, 0.5, 0]);

  // 网站名字层 - 在logo消失后出现
  const titleOpacity = useTransform(scrollYProgress, [0.05, 0.1, 0.25, 0.3], [0, 1, 1, 0]);
  const titleY = useTransform(scrollYProgress, [0.05, 0.1], [50, 0]);

  // 宣传语层 - 在title消失后出现
  const taglineOpacity = useTransform(scrollYProgress, [0.2, 0.25, 0.4, 0.45], [0, 1, 1, 0]);
  const taglineY = useTransform(scrollYProgress, [0.2, 0.25], [50, 0]);

  // 3D折叠效果 - 滚动到末尾时整个视差层沿X轴向后折叠
  const foldRotateX = useTransform(scrollYProgress, [0.6, 1], [0, 70]);
  const foldTranslateZ = useTransform(scrollYProgress, [0.6, 1], [0, -800]);
  const foldScale = useTransform(scrollYProgress, [0.6, 1], [1, 0.8]);
  const foldBlur = useTransform(scrollYProgress, [0.6, 1], [0, 40]);
  const foldOpacity = useTransform(scrollYProgress, [0.6, 1], [1, 0]);

  return (
    <div ref={containerRef} className="relative">
      {/* 3D折叠容器 - 包含所有视差层 */}
      <motion.div
        className="fixed inset-0"
        style={{
          perspective: '500px',
          transformStyle: 'preserve-3d',
          rotateX: foldRotateX,
          translateZ: foldTranslateZ,
          scale: foldScale,
          filter: useTransform(foldBlur, (v) => `blur(${v}px)`),
          opacity: foldOpacity,
        }}
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
          {/* <video
            src="/videos/hero-background.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          /> */}
          {/* 临时占位背景 */}
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
        </motion.div>

        {/* Logo层 */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
          style={{
            scale: logoScale,
            filter: useTransform(logoBlur, (v) => `blur(${v}px)`),
            opacity: logoOpacity,
          }}
        >
          <div className="text-center">
            {/* TODO: 替换为用户的Logo图片 */}
            {/* <img src="/images/logo.png" alt="Logo" className="w-64 h-64" /> */}
            <div className="w-48 h-48 mx-auto bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center">
              <span className="text-6xl font-black text-white">LOGO</span>
            </div>
          </div>
        </motion.div>

        {/* 网站名字层 */}
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-wider">
            BREAK IT DOWN
          </h1>
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
      <div className="h-[400vh]" />

      {/* 宣传内容区域 - 滚动到这里显示 */}
      <div className="relative z-50 bg-black text-white">
        {/* 特性介绍 1 */}
        <section className="min-h-screen flex items-center justify-center py-20">
          <div className="max-w-6xl mx-auto px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              {/* 前后对比滑块 */}
              <ComparisonSlider
                before={
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-2">📷</span>
                    <span className="text-gray-400">上传图片</span>
                  </div>
                }
                after={
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex flex-col items-center justify-center border-2 border-cyan-400/50">
                    <span className="text-4xl mb-2">✅</span>
                    <span className="text-cyan-300 font-medium">iPhone 15 Pro</span>
                    <span className="text-sm text-gray-400 mt-1">电子产品 · 手机</span>
                  </div>
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
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-6">
                    <span className="text-4xl mb-2">📦</span>
                    <span className="text-gray-400">iPhone 15 Pro</span>
                  </div>
                }
                after={
                  <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex flex-col items-center justify-center p-4 border-2 border-pink-400/50 overflow-auto">
                    <div className="text-sm text-pink-300 font-medium mb-2">组成部分</div>
                    <div className="text-xs space-y-1 text-gray-300">
                      <div>📱 A17 Pro 芯片</div>
                      <div>🖥️ OLED 显示屏</div>
                      <div>🔋 钛金属边框</div>
                      <div>📷 4800万像素摄像头</div>
                      <div>🔊 立体声扬声器</div>
                    </div>
                  </div>
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
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-2">📋</span>
                    <span className="text-gray-400">纯文本数据</span>
                  </div>
                }
                after={
                  <div className="w-full h-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex flex-col items-center justify-center border-2 border-amber-400/50 p-4">
                    <div className="text-amber-300 font-medium mb-2">知识图谱</div>
                    <div className="w-full h-48 bg-black/30 rounded-lg flex items-center justify-center">
                      <div className="text-2xl">🕸️</div>
                    </div>
                  </div>
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
                  🚀 新建拆解
                </button>
              ) : (
                <button
                  className="px-12 py-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  onClick={() => router.push('/login')}
                >
                  🔐 登录 / 注册
                </button>
              )}
              <Link href="/about">
                <button className="px-12 py-5 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-xl font-bold text-xl hover:bg-white/20 hover:border-white/40 transition-all duration-300">
                  关于我们
                </button>
              </Link>
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
