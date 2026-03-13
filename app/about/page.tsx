'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../hooks/useTheme';
import {
  TrophyIcon,
  LightBulbIcon,
  SparklesIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  BoltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function About() {
  const router = useRouter();
  const { theme, themeConfig } = useTheme();
  const isDarkTheme = theme === 'dark';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      }
    }
  };

  return (
    <main className={`min-h-screen bg-gradient-to-br ${themeConfig.backgroundGradient} ${themeConfig.textPrimary}`}>
      <div className="container mx-auto px-4 py-16">
        <motion.div
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* 返回按钮 */}
          <motion.div variants={itemVariants} className="mb-8">
            <Link href="/">
              <motion.button
                className={`px-6 py-3 backdrop-blur-lg border rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  isDarkTheme
                    ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                    : 'bg-white/80 border-slate-200 hover:bg-white text-slate-800'
                }`}
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>←</span>
                <span>返回首页</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* 标题 */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
          >
            关于 Break It Down
          </motion.h1>

          {/* 项目简介 */}
          <motion.div
            variants={itemVariants}
            className={`backdrop-blur-lg rounded-xl p-8 mb-8 border ${
              isDarkTheme
                ? 'bg-white/10 border-white/20'
                : 'bg-white border-slate-300 shadow-lg'
            }`}
          >
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <TrophyIcon className="w-7 h-7 text-blue-400" />
              <span>项目简介</span>
            </h2>
            <p className={`text-lg leading-relaxed ${isDarkTheme ? 'text-gray-300' : 'text-slate-700'}`}>
              Break It Down 是一个创新的交互式可视化项目，旨在通过 AI 技术帮助用户理解复杂物体的构成。
              我们将任何物体逐层拆解，直至最基本的原材料，让您以全新的视角认识身边的事物。
            </p>
          </motion.div>

          {/* 核心理念 */}
          <motion.div
            variants={itemVariants}
            className={`backdrop-blur-lg rounded-xl p-8 mb-8 border ${
              isDarkTheme
                ? 'bg-white/10 border-white/20'
                : 'bg-white border-slate-300 shadow-lg'
            }`}
          >
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <LightBulbIcon className="w-7 h-7 ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}" />
              <span>核心理念</span>
            </h2>
            <div className={`space-y-4 ${isDarkTheme ? 'text-gray-300' : 'text-slate-700'}`}>
              <p className="text-lg leading-relaxed">
                <strong className={isDarkTheme ? 'text-white' : 'text-slate-900'}>熵逆转</strong> -
                在物理学中，熵代表系统的混乱程度。我们的项目反其道而行之，
                将复杂的成品"逆向"拆解为简单的原材料，让混乱回归有序。
              </p>
              <p className="text-lg leading-relaxed">
                这不仅是一个技术展示，更是一种思维方式：
                <strong className={isDarkTheme ? 'text-purple-300' : 'text-purple-700'}>从复杂到简单，从表象到本质</strong>。
              </p>
            </div>
          </motion.div>

          {/* 功能特性 */}
          <motion.div
            variants={itemVariants}
            className={`backdrop-blur-lg rounded-xl p-8 mb-8 border ${
              isDarkTheme
                ? 'bg-white/10 border-white/20'
                : 'bg-white border-slate-300 shadow-lg'
            }`}
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <SparklesIcon className="w-7 h-7 text-cyan-400" />
              <span>功能特性</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className={`rounded-lg p-6 border ${isDarkTheme ? 'bg-black/30' : 'bg-white border-slate-300 shadow-sm'}`}>
                <PhotoIcon className="w-10 h-10 text-cyan-400" />
                <h3 className="text-xl font-semibold mb-2">AI 图片识别</h3>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>
                  上传图片，AI 自动识别物体类型和名称，快速开始拆解
                </p>
              </div>
              <div className={`rounded-lg p-6 border ${isDarkTheme ? 'bg-black/30' : 'bg-white border-slate-300 shadow-sm'}`}>
                <MagnifyingGlassIcon className="w-10 h-10 text-cyan-400" />
                <h3 className="text-xl font-semibold mb-2">递归拆解</h3>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>
                  逐层深入拆解物体，直至最基本的原材料，完整呈现物品构成
                </p>
              </div>
              <div className={`rounded-lg p-6 border ${isDarkTheme ? 'bg-black/30' : 'bg-white border-slate-300 shadow-sm'}`}>
                <CubeIcon className="w-10 h-10 text-cyan-400" />
                <h3 className="text-xl font-semibold mb-2">交互式可视化</h3>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>
                  树状图谱展示，支持拖拽节点、缩放画布、全屏查看
                </p>
              </div>
              <div className={`rounded-lg p-6 border ${isDarkTheme ? 'bg-black/30' : 'bg-white border-slate-300 shadow-sm'}`}>
                <LightBulbIcon className="w-10 h-10 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-2">知识卡片</h3>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>
                  点击任意节点，生成详细制造工艺流程，了解物品是如何被制造的
                </p>
              </div>
              <div className={`rounded-lg p-6 border ${isDarkTheme ? 'bg-black/30' : 'bg-white border-slate-300 shadow-sm'}`}>
                <RocketLaunchIcon className="w-10 h-10 text-green-400" />
                <h3 className="text-xl font-semibold mb-2">生产成本分析</h3>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>
                  分析各组成部分的成本占比和来源，生成详细的物料清单和价格预算
                </p>
              </div>
              <div className={`rounded-lg p-6 border ${isDarkTheme ? 'bg-black/30' : 'bg-white border-slate-300 shadow-sm'}`}>
                <TrophyIcon className="w-10 h-10 text-purple-400" />
                <h3 className="text-xl font-semibold mb-2">历史记录</h3>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>
                  自动保存拆解记录，随时回顾历史作品，支持重新加载和继续拆解
                </p>
              </div>
            </div>
          </motion.div>

          {/* 技术栈 */}
          <motion.div
            variants={itemVariants}
            className={`backdrop-blur-lg rounded-xl p-8 mb-8 border ${
              isDarkTheme
                ? 'bg-white/10 border-white/20'
                : 'bg-white border-slate-300 shadow-lg'
            }`}
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <WrenchScrewdriverIcon className="w-7 h-7 text-orange-400" />
              <span>技术栈</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`flex items-center gap-3 rounded-lg p-4 ${isDarkTheme ? 'bg-black/30' : 'bg-white border border-slate-200'}`}>
                <CpuChipIcon className="w-8 h-8 text-cyan-400" />
                <div>
                  <div className="font-semibold">Next.js 15 + React 19</div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>现代化全栈框架</div>
                </div>
              </div>
              
              <div className={`flex items-center gap-3 rounded-lg p-4 ${isDarkTheme ? 'bg-black/30' : 'bg-white border border-slate-200'}`}>
                <SparklesIcon className="w-8 h-8 text-pink-400" />
                <div>
                  <div className="font-semibold">React Flow</div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>交互式图谱引擎</div>
                </div>
              </div>
              <div className={`flex items-center gap-3 rounded-lg p-4 ${isDarkTheme ? 'bg-black/30' : 'bg-white border border-slate-200'}`}>
                <span className="text-2xl">✨</span>
                <div>
                  <div className="font-semibold">Framer Motion</div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>流畅动画效果</div>
                </div>
              </div>
              <div className={`flex items-center gap-3 rounded-lg p-4 ${isDarkTheme ? 'bg-black/30' : 'bg-white border border-slate-200'}`}>
                <CubeIcon className="w-8 h-8 text-green-400" />
                <div>
                  <div className="font-semibold">Tailwind CSS</div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>现代响应式样式</div>
                </div>
              </div>
              <div className={`flex items-center gap-3 rounded-lg p-4 ${isDarkTheme ? 'bg-black/30' : 'bg-white border border-slate-200'}`}>
                <BoltIcon className="w-8 h-8 text-yellow-400" />
                <div>
                  <div className="font-semibold">Prisma + PostgreSQL</div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>数据持久化存储</div>
                </div>
              </div>
              <div className={`flex items-center gap-3 rounded-lg p-4 ${isDarkTheme ? 'bg-black/30' : 'bg-white border border-slate-200'}`}>
                <ShieldCheckIcon className="w-8 h-8 text-green-400" />
                <div>
                  <div className="font-semibold">NextAuth.js</div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-700'}`}>安全用户认证</div>
                </div>
              </div>
              
            </div>
          </motion.div>

          {/* 使用场景 */}
          <motion.div
            variants={itemVariants}
            className={`backdrop-blur-lg rounded-xl p-8 mb-8 border ${
              isDarkTheme
                ? 'bg-white/10 border-white/20'
                : 'bg-white border-slate-300 shadow-lg'
            }`}
          >
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <SparklesIcon className="w-7 h-7 text-green-400" />
              <span>使用场景</span>
            </h2>
            <ul className={`space-y-3 ${isDarkTheme ? 'text-gray-300' : 'text-slate-700'}`}>
              <li className="flex items-start gap-3">
                <span className="${isDarkTheme ? 'text-purple-400' : 'text-purple-600'} mt-1">▸</span>
                <span><strong>教育学习</strong>：帮助学生理解物品的构成和制造过程</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="${isDarkTheme ? 'text-purple-400' : 'text-purple-600'} mt-1">▸</span>
                <span><strong>产品设计</strong>：分析竞品的材料和结构组成</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="${isDarkTheme ? 'text-purple-400' : 'text-purple-600'} mt-1">▸</span>
                <span><strong>环保意识</strong>：了解产品的原材料来源，培养可持续发展意识</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="${isDarkTheme ? 'text-purple-400' : 'text-purple-600'} mt-1">▸</span>
                <span><strong>趣味探索</strong>：满足好奇心，探索日常物品的"内在世界"</span>
              </li>
            </ul>
          </motion.div>

          {/* 新建拆解 CTA */}
          <motion.div
            variants={itemVariants}
            className="text-center"
          >
            <motion.button
              className="group relative px-12 py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 bg-size-200 animate-gradient rounded-xl font-bold text-xl shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // 清除所有缓存
                localStorage.removeItem('deconstructionTree');
                localStorage.removeItem('identificationResult');
                localStorage.removeItem('imagePreview');
                localStorage.removeItem('knowledgeCache');
                localStorage.removeItem('nodePositions');
                localStorage.removeItem('humorLevel');
                localStorage.removeItem('professionalLevel');
                localStorage.removeItem('promptMode');
                localStorage.removeItem('customPrompt');
                // 导航到拆解页面
                router.push('/setup');
              }}
            >
              <span className="relative z-10 flex items-center">
                <RocketLaunchIcon className="w-6 h-6 mr-2 group-hover:animate-bounce" />新建拆解
              </span>
            </motion.button>
          </motion.div>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className={`text-center mt-12 text-sm ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}
          >
            <p>Break It Down © 2024 · Powered by AI</p>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
