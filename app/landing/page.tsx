'use client';

import { useRouter } from 'next/navigation';

const products = [
  { id: 1, name: '客制化运动夹克', price: '899', tag: '热销', image: '/images/products/1.webp', sales: '月销 3.2万' },
  { id: 2, name: '定制休闲连衣裙', price: '599', tag: '新品', image: '/images/products/2.webp', sales: '月销 8,600' },
  { id: 3, name: '原创印花 T 恤', price: '199', tag: '', image: '/images/products/3.webp', sales: '月销 1.5万' },
  { id: 4, name: '定制牛仔外套', price: '699', tag: '特惠', image: '/images/products/4.webp', sales: '月销 6,200' },
  { id: 5, name: '手工皮革钱包', price: '349', tag: '', image: '/images/products/5.webp', sales: '月销 4,100' },
  { id: 6, name: '客制化机械键盘', price: '899', tag: '', image: '/images/products/6.webp', sales: '月销 9,800' },
];

const services = [
  { icon: '🎨', title: '自由定制', desc: '从材料到工艺，每个细节都由你决定' },
  { icon: '🏭', title: '工厂直供', desc: '对接源头工厂，省去中间商差价' },
  { icon: '🔍', title: '原料透明', desc: '全链路溯源，清楚知道用了什么料' },
  { icon: '✅', title: '品质保障', desc: '出厂检验，假一赔十' },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif", background: '#f3f4f6', minHeight: '100vh', color: '#111' }}>

      {/* ── 顶栏（Bagisto desktop header） ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 999,
        background: '#fff', borderBottom: '1px solid #e8e8e8',
        height: 64, display: 'flex', alignItems: 'center',
        padding: '0 60px', gap: 40,
      }}>
        {/* Logo */}
        <span style={{ fontSize: 20, fontWeight: 800, color: '#ff5b00', letterSpacing: 1, flexShrink: 0 }}>1688</span>

        {/* 分类导航 */}
        <nav style={{ display: 'flex', gap: 28, fontSize: 14, color: '#444', flex: 1 }}>
          {['首页', '数码', '家电', '服饰', '食品', '定制'].map(t => (
            <a key={t} href="#" style={{ color: '#444', textDecoration: 'none', paddingBottom: 2, borderBottom: '2px solid transparent', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff5b00'; e.currentTarget.style.borderBottomColor = '#ff5b00'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.borderBottomColor = 'transparent'; }}
            >{t}</a>
          ))}
        </nav>

        {/* 搜索框 */}
        <div style={{ display: 'flex', width: 320 }}>
          <input placeholder="搜索商品..." style={{
            flex: 1, height: 38, padding: '0 14px', fontSize: 13,
            border: '2px solid #ff5b00', borderRight: 'none',
            borderRadius: '6px 0 0 6px', outline: 'none', background: '#fff',
          }} />
          <button style={{
            width: 48, height: 38, background: '#ff5b00', color: '#fff',
            border: 'none', borderRadius: '0 6px 6px 0', fontSize: 16, cursor: 'pointer',
            transition: 'background .15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e04e00')}
            onMouseLeave={e => (e.currentTarget.style.background = '#ff5b00')}
          >🔍</button>
        </div>

        {/* 图标组 */}
        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#666', flexShrink: 0 }}>
          <span style={{ cursor: 'pointer' }}>❤️ 收藏</span>
          <span style={{ cursor: 'pointer' }}>🛒 购物车</span>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>👤</div>
        </div>
      </header>

      {/* ── Hero Banner（Bagisto 全宽轮播位） ── */}
      <section style={{
        background: 'linear-gradient(120deg, #c93a00 0%, #ff5b00 60%, #ff8c42 100%)',
        padding: '64px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: 2, marginBottom: 12 }}>工厂直供 · 品质定制</p>
          <h1 style={{ color: '#fff', fontSize: 44, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>
            定制你的<br />独一无二
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, marginBottom: 32 }}>从原材料到成品，全链路透明，打造专属于你的产品</p>
          <button style={{
            padding: '12px 32px', background: '#fff', color: '#ff5b00',
            border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            transition: 'background .15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fff8f5')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >立即定制</button>
        </div>
        <div style={{ fontSize: 120, opacity: 0.9 }}>🛍️</div>
      </section>

      {/* ── 服务栏（Bagisto services bar） ── */}
      <section style={{ borderBottom: '1px solid #e8e8e8', padding: '28px 60px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          {services.map(s => (
            <div key={s.title} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{
                width: 52, height: 52, borderRadius: '50%', border: '1px solid #ff5b00',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                color: '#ff5b00',
              }}>{s.icon}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px', color: '#111' }}>{s.title}</p>
                <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BID 宣传横幅 ── */}
      <section style={{ padding: '32px 60px 0', maxWidth: 1200, margin: '0 auto' }}>
        <div
          onClick={() => router.push('/')}
          style={{
            background: 'linear-gradient(135deg, #060C3B 0%, #0d1a6e 60%, #1a2fa0 100%)',
            borderRadius: 6, padding: '28px 40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ background: '#ff5b00', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>独家定制</span>
              <span style={{ background: '#f5a623', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>AI 驱动</span>
            </div>
            <p style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>想要一个独一无二的产品？从原材料开始设计它</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
              告诉我们你的想法 → AI 拆解原材料构成与工艺路线 → 对接工厂 · 透明报价 · 全程可视化
            </p>
          </div>
          <button style={{
            background: '#ff5b00', color: '#fff', border: 'none',
            padding: '12px 28px', borderRadius: 6, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'background .15s',
            boxShadow: '0 4px 16px rgba(255,91,0,0.4)',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e04e00')}
            onMouseLeave={e => (e.currentTarget.style.background = '#ff5b00')}
          >✨ 开始定制我的产品 →</button>
        </div>
      </section>

      {/* ── 商品网格 ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 60px 48px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 24 }}>热门定制品类</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {products.map(p => (
            <div key={p.id} style={{
              background: '#fff', borderRadius: 6, border: '1px solid #e8e8e8',
              overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ height: 180, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              </div>
              <div style={{ padding: '12px 14px 16px' }}>
                {p.tag && <span style={{ fontSize: 11, color: '#ff5b00', border: '1px solid #ff5b00', borderRadius: 3, padding: '1px 5px', marginBottom: 6, display: 'inline-block' }}>{p.tag}</span>}
                <p style={{ fontSize: 13, color: '#111', margin: '4px 0 8px', lineHeight: 1.4 }}>{p.name}</p>
                <div style={{ background: '#fff8f5', border: '1px solid #ffd0b0', borderRadius: 6, padding: '6px 10px', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#ff5b00' }}>¥</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#ff5b00', fontFamily: 'Arial' }}>{p.price}</span>
                </div>
                <p style={{ fontSize: 12, color: '#999', margin: '0 0 12px' }}>{p.sales}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{
                    flex: 1, height: 32, borderRadius: 6, fontSize: 12, fontWeight: 700,
                    border: '2px solid #ff5b00', background: '#fff', color: '#ff5b00', cursor: 'pointer',
                    transition: 'background .15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fff8f5')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >加入采购车</button>
                  <button style={{
                    flex: 1, height: 32, borderRadius: 6, fontSize: 12, fontWeight: 700,
                    border: 'none', background: '#ff5b00', color: '#fff', cursor: 'pointer',
                    transition: 'background .15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e04e00')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#ff5b00')}
                  >立即采购</button>
                </div>
              </div>
            </div>
          ))}

          {/* 定制拆解卡片 */}
          <div onClick={() => router.push('/')} style={{
            background: 'linear-gradient(160deg, #1a0a00 0%, #7a2500 60%, #ff5b00 160%)',
            borderRadius: 6, border: '2px solid #ff5b00',
            overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column',
            transition: 'box-shadow .15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,91,0,0.35)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>🔬</div>
            <div style={{ padding: '12px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, background: '#ff5b00', color: '#fff', borderRadius: 3, padding: '1px 6px', marginBottom: 8, display: 'inline-block', width: 'fit-content' }}>独家 · 定制服务</span>
              <p style={{ fontSize: 13, color: '#fff', fontWeight: 600, margin: '0 0 6px', lineHeight: 1.4 }}>定制你的独一无二<br />从原材料开始设计</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: '0 0 14px', flex: 1 }}>你的想法 → 原料选配 → 工艺路线 → 工厂对接</p>
              <button style={{
                width: '100%', height: 34, borderRadius: 6, fontSize: 12, fontWeight: 700,
                border: 'none', background: '#ff5b00', color: '#fff', cursor: 'pointer',
                transition: 'background .15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e04e00')}
                onMouseLeave={e => (e.currentTarget.style.background = '#ff5b00')}
              >开始定制 →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#fff8f5', borderTop: '1px solid #ffd0b0', padding: '24px 60px', textAlign: 'center', fontSize: 12, color: '#999' }}>
        <p style={{ margin: 0 }}>© 2025 1688定制平台 · 工厂直供 · 原料透明 · 品质保障</p>
      </footer>

    </div>
  );
}
