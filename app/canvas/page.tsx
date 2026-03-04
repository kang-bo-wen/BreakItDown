'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Dynamic import GraphView to avoid SSR issues
const GraphView = dynamic(() => import('../components/GraphView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] tech-card flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin"></div>
        <div className="text-cyan-300/60">加载图谱中...</div>
      </div>
    </div>
  ),
});

// Dynamic import DecompositionTree to avoid SSR issues
const DecompositionTree = dynamic(() => import('../components/DecompositionTree'), {
  ssr: false,
});

interface IdentificationResult {
  name: string;
  category: string;
  brief_description: string;
  icon: string;
  imageUrl?: string;
  searchTerm?: string;
}

interface DeconstructionPart {
  name: string;
  description: string;
  is_raw_material: boolean;
  icon: string;
  imageUrl?: string;
  searchTerm?: string;
}

interface DeconstructionResult {
  parent_item: string;
  parts: DeconstructionPart[];
}

interface TreeNode {
  id: string;
  name: string;
  description: string;
  isRawMaterial: boolean;
  icon?: string;
  imageUrl?: string;
  children: TreeNode[];
  isExpanded: boolean;
}

interface KnowledgeCardData {
  title: string;
  doc_number: string;
  steps: {
    step_number: number;
    action_title: string;
    description: string;
    parameters: { label: string; value: string }[];
    ai_image_prompt: string;
  }[];
}

function CanvasContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State loaded from setup page
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [breakdownMode, setBreakdownMode] = useState<'basic' | 'production'>('basic');
  const [humorLevel, setHumorLevel] = useState(50);
  const [professionalLevel, setProfessionalLevel] = useState(70);
  const [detailLevel, setDetailLevel] = useState(50);
  const [promptMode, setPromptMode] = useState<'simple' | 'advanced'>('simple');
  const [customPrompt, setCustomPrompt] = useState('');

  // Deconstruction tree state
  const [deconstructionTree, setDeconstructionTree] = useState<TreeNode | null>(null);
  const [isDeconstructing, setIsDeconstructing] = useState(false);
  const [loadingNodeIds, setLoadingNodeIds] = useState<Set<string>>(new Set());

  // Knowledge card state
  const [knowledgeCard, setKnowledgeCard] = useState<{ node: TreeNode; data: KnowledgeCardData } | null>(null);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [knowledgeCache, setKnowledgeCache] = useState<Map<string, KnowledgeCardData>>(new Map());
  const [loadingKnowledgeIds, setLoadingKnowledgeIds] = useState<Set<string>>(new Set());

  // Session state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionCache, setSessionCache] = useState<Map<string, any>>(new Map());
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const lastSavedDataRef = useRef<string | null>(null);
  const isCreatingSessionRef = useRef(false); // Prevent duplicate session creation
  const isInitializedRef = useRef(false); // Track if initial load is complete

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Edge type state
  const [edgeType, setEdgeType] = useState<'bezier' | 'smoothstep' | 'straight'>('bezier');

  // Theme state (true = dark, false = light)
  // Default to dark theme to match SSR, then sync with localStorage after mount
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Load theme from localStorage after mount (client-only)
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    setIsDarkTheme(saved ? saved === 'dark' : true);
    setThemeLoaded(true);
  }, []);

  // Persist theme to localStorage when it changes
  useEffect(() => {
    if (themeLoaded) {
      localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    }
  }, [isDarkTheme, themeLoaded]);

  // Hovered node state for tree view synchronization
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Knowledge request queue
  const knowledgeRequestQueue = useState(() => {
    let activeRequests = 0;
    const maxConcurrent = 4;
    const highPriorityQueue: Array<() => Promise<void>> = [];
    const lowPriorityQueue: Array<() => Promise<void>> = [];

    const processQueue = async () => {
      if (activeRequests >= maxConcurrent) return;

      const task = highPriorityQueue.shift() || lowPriorityQueue.shift();
      if (!task) return;

      activeRequests++;
      try {
        await task();
      } finally {
        activeRequests--;
        processQueue();
      }
    };

    return {
      enqueue: (task: () => Promise<void>, highPriority: boolean = false) => {
        if (highPriority) {
          highPriorityQueue.push(task);
        } else {
          lowPriorityQueue.push(task);
        }
        processQueue();
      }
    };
  })[0];

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Load setup state from localStorage
  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    if (sessionId) {
      return;
    }

    const savedSetup = localStorage.getItem('setupState');
    if (savedSetup) {
      try {
        const parsed = JSON.parse(savedSetup);
        if (parsed.identificationResult) {
          setIdentificationResult(parsed.identificationResult);
        }
        if (parsed.imagePreview) {
          setImagePreview(parsed.imagePreview);
        }
        if (parsed.promptSettings) {
          setHumorLevel(parsed.promptSettings.humorLevel ?? 50);
          setProfessionalLevel(parsed.promptSettings.professionalLevel ?? 70);
          setDetailLevel(parsed.promptSettings.detailLevel ?? 50);
          setPromptMode(parsed.promptSettings.promptMode ?? 'simple');
          setCustomPrompt(parsed.promptSettings.customPrompt ?? '');
        }
        if (parsed.breakdownMode) {
          setBreakdownMode(parsed.breakdownMode);
        }
      } catch (error) {
        console.error('恢复设置状态失败:', error);
      }
    }

    // Also restore other states
    const savedTree = localStorage.getItem('deconstructionTree');
    const savedKnowledgeCache = localStorage.getItem('knowledgeCache');

    if (savedTree) {
      try {
        setDeconstructionTree(JSON.parse(savedTree));
      } catch (error) {
        console.error('恢复拆解树失败:', error);
      }
    }

    if (savedKnowledgeCache) {
      try {
        const cacheArray = JSON.parse(savedKnowledgeCache);
        setKnowledgeCache(new Map(cacheArray));
      } catch (error) {
        console.error('恢复知识卡片缓存失败:', error);
      }
    }

    // Mark initialization as complete
    isInitializedRef.current = true;
    // Clear fromSetup flag if we're not creating a new session
    localStorage.removeItem('fromSetup');
  }, [searchParams]);

  // Save deconstruction tree to localStorage
  useEffect(() => {
    if (deconstructionTree) {
      localStorage.setItem('deconstructionTree', JSON.stringify(deconstructionTree));
    }
  }, [deconstructionTree]);

  // Save knowledge cache to localStorage
  useEffect(() => {
    if (knowledgeCache.size > 0) {
      const cacheArray = Array.from(knowledgeCache.entries());
      localStorage.setItem('knowledgeCache', JSON.stringify(cacheArray));
    }
  }, [knowledgeCache]);

  // Check sessionId in URL and load session
  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    if (sessionId && status === 'authenticated') {
      loadSession(sessionId);
    }
  }, [searchParams, status]);

  // Auto-create session when tree exists (but not if sessionId is in URL)
  useEffect(() => {
    // Don't create new session if URL already has sessionId - we should load instead
    const urlSessionId = searchParams.get('sessionId');
    // Prevent duplicate creation and run only after initial load is complete
    if (isCreatingSessionRef.current || !isInitializedRef.current) return;
    // Only create session if we just came from setup (indicated by fromSetup flag)
    const fromSetup = localStorage.getItem('fromSetup');
    if (!fromSetup) return;
    if (!identificationResult || !deconstructionTree || currentSessionId || urlSessionId || status !== 'authenticated') return;

    const createSession = async () => {
      isCreatingSessionRef.current = true;
      try {
        const savedPositions = localStorage.getItem('nodePositions');
        const nodePositions = savedPositions ? JSON.parse(savedPositions) : undefined;

        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `${identificationResult.name} 拆解`,
            treeData: deconstructionTree,
            promptSettings: {
              humorLevel,
              professionalLevel,
              promptMode,
              customPrompt: promptMode === 'advanced' ? customPrompt : undefined
            },
            knowledgeCache: knowledgeCache.size > 0
              ? Array.from(knowledgeCache.entries())
              : undefined,
            nodePositions,
            identificationResult: identificationResult,
            rootObjectName: identificationResult.name,
            rootObjectIcon: identificationResult.icon,
            rootObjectImage: imagePreview
          })
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentSessionId(data.session.id);
          // Set initial data hash to prevent duplicate auto-save
          lastSavedDataRef.current = JSON.stringify({
            tree: deconstructionTree,
            cache: Array.from(knowledgeCache.entries())
          });
          // Clear the fromSetup flag after successful creation
          localStorage.removeItem('fromSetup');
          router.push(`/canvas?sessionId=${data.session.id}`);
        }
      } catch (error) {
        console.error('自动创建会话失败:', error);
      } finally {
        isCreatingSessionRef.current = false;
      }
    };

    createSession();
  }, [identificationResult, deconstructionTree, currentSessionId, status]);

  // Auto-save session (only when tree or cache actually changes, not when sessionId is first set)
  useEffect(() => {
    // Skip if no valid session or not authenticated
    if (!currentSessionId || !deconstructionTree || status !== 'authenticated') return;

    // Skip if this is the initial save (session was just created)
    const isInitialSave = !lastSavedDataRef.current;
    if (isInitialSave) return;

    const currentDataHash = JSON.stringify({
      tree: deconstructionTree,
      cache: Array.from(knowledgeCache.entries())
    });

    // Skip if data hasn't changed
    if (lastSavedDataRef.current === currentDataHash) {
      return;
    }

    if (sessionCache.has(currentSessionId)) {
      setSessionCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(currentSessionId);
        return newCache;
      });
    }

    const timer = setTimeout(() => {
      lastSavedDataRef.current = currentDataHash;
      saveSessionToDatabase(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [deconstructionTree, knowledgeCache, currentSessionId, status]);

  // Load session from database
  const loadSession = async (sessionId: string) => {
    setIsLoadingSession(true);
    try {
      let session: any;

      if (sessionCache.has(sessionId)) {
        session = sessionCache.get(sessionId);
      } else {
        const response = await fetch(`/api/sessions/${sessionId}`);

        if (!response.ok) {
          throw new Error('加载会话失败');
        }

        const data = await response.json();
        session = data.session || data;
        setSessionCache(prev => new Map(prev).set(sessionId, session));
      }

      // Check if session has treeData - if not, redirect to setup page
      if (!session.treeData || (typeof session.treeData === 'object' && Object.keys(session.treeData).length === 0)) {
        // No tree data yet, redirect to setup page with sessionId
        console.log('🔄 会话暂无拆解数据，跳转到调制界面');
        router.push(`/setup?sessionId=${sessionId}`);
        return;
      }

      setDeconstructionTree(session.treeData);

      // Save setup state to localStorage for potential return
      const setupState = {
        identificationResult: session.identificationResult || {
          name: session.rootObjectName,
          category: '',
          brief_description: '',
          icon: session.rootObjectIcon || '',
          imageUrl: session.rootObjectImage
        },
        imagePreview: session.rootObjectImage,
        promptSettings: session.promptSettings || {
          humorLevel: 50,
          professionalLevel: 70,
          detailLevel: 50,
          promptMode: 'simple',
          customPrompt: ''
        }
      };
      localStorage.setItem('setupState', JSON.stringify(setupState));

      if (session.identificationResult) {
        setIdentificationResult(session.identificationResult);
      } else {
        setIdentificationResult({
          name: session.rootObjectName,
          category: '',
          brief_description: '',
          icon: session.rootObjectIcon || '',
          imageUrl: session.rootObjectImage
        });
      }

      setImagePreview(session.rootObjectImage);

      if (session.promptSettings) {
        setHumorLevel(session.promptSettings.humorLevel || 50);
        setProfessionalLevel(session.promptSettings.professionalLevel || 70);
        setDetailLevel(session.promptSettings.detailLevel || 50);
        if (session.promptSettings.promptMode) {
          setPromptMode(session.promptSettings.promptMode);
        }
        if (session.promptSettings.customPrompt) {
          setCustomPrompt(session.promptSettings.customPrompt);
        }
      }

      if (session.knowledgeCache) {
        try {
          const cacheArray = session.knowledgeCache as [string, KnowledgeCardData][];
          const restoredCache = new Map<string, KnowledgeCardData>(cacheArray);
          setKnowledgeCache(restoredCache);
        } catch (error) {
          console.error('恢复知识卡片缓存失败:', error);
        }
      }

      if (session.nodePositions) {
        try {
          localStorage.setItem('nodePositions', JSON.stringify(session.nodePositions));
        } catch (error) {
          console.error('恢复节点位置失败:', error);
        }
      }

      setCurrentSessionId(sessionId);
      setIsLoadingSession(false);

      // Reset creation flag to allow creating new sessions later
      isCreatingSessionRef.current = false;

      // Set initial data hash to prevent duplicate auto-save after loading
      lastSavedDataRef.current = JSON.stringify({
        tree: session.treeData,
        cache: session.knowledgeCache || []
      });

      setImagePreview(session.rootObjectImage);

      // Mark initialization as complete
      isInitializedRef.current = true;
      // Clear fromSetup flag since we're loading an existing session
      localStorage.removeItem('fromSetup');

    } catch (error) {
      console.error('加载会话错误:', error);
      alert('加载会话失败，请重试');
      // Still mark as initialized even on error
      isInitializedRef.current = true;
      localStorage.removeItem('fromSetup');
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Save session to database
  const saveSessionToDatabase = async (showSuccessMessage: boolean = true) => {
    if (!deconstructionTree || !identificationResult) return;

    setIsSaving(true);

    try {
      const method = currentSessionId ? 'PUT' : 'POST';
      const url = currentSessionId
        ? `/api/sessions/${currentSessionId}`
        : '/api/sessions';

      const savedPositions = localStorage.getItem('nodePositions');
      const nodePositions = savedPositions ? JSON.parse(savedPositions) : undefined;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentSessionId
            ? undefined
            : `${identificationResult.name} 拆解`,
          treeData: deconstructionTree,
          promptSettings: {
            humorLevel,
            professionalLevel,
            detailLevel,
            promptMode,
            customPrompt: promptMode === 'advanced' ? customPrompt : undefined
          },
          knowledgeCache: knowledgeCache.size > 0
            ? Array.from(knowledgeCache.entries())
            : undefined,
          nodePositions,
          identificationResult: identificationResult,
          rootObjectName: identificationResult.name,
          rootObjectIcon: identificationResult.icon,
          rootObjectImage: imagePreview
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`保存会话失败: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();

      if (!currentSessionId) {
        setCurrentSessionId(data.session.id);
        router.push(`/canvas?sessionId=${data.session.id}`);
      }

      if (showSuccessMessage) {
        alert('保存成功！');
      }
    } catch (error) {
      console.error('保存会话错误:', error);
      if (showSuccessMessage) {
        alert('保存失败，请重试');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Highlight children names in text
  const highlightChildrenNames = (text: string, childrenNames: string[]) => {
    if (!text || childrenNames.length === 0) return text;

    const sortedNames = [...childrenNames].sort((a, b) => b.length - a.length);
    const pattern = sortedNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'g');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) => {
          if (sortedNames.includes(part)) {
            return (
              <span key={index} className="font-bold text-red-400">
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  // Single-level deconstruction
  const deconstructItem = async (
    itemName: string,
    parentDescription: string,
    parentContext?: string,
    parentIcon?: string,
    parentImageUrl?: string
  ): Promise<TreeNode> => {

    const response = await fetch('/api/deconstruct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemName,
        parentContext,
        promptOptions: {
          humorLevel,
          professionalLevel,
          detailLevel,
          customTemplate: promptMode === 'advanced' ? customPrompt : undefined
        }
      }),
    });

    if (!response.ok) {
      throw new Error('拆解失败');
    }

    const result: DeconstructionResult = await response.json();

    const children: TreeNode[] = result.parts.map(part => ({
      id: `${Date.now()}-${Math.random()}-${part.name}`,
      name: part.name,
      description: part.description,
      isRawMaterial: part.is_raw_material,
      icon: part.icon,
      imageUrl: part.imageUrl,
      children: [],
      isExpanded: false,
    }));

    const currentNode: TreeNode = {
      id: `${Date.now()}-${itemName}`,
      name: itemName,
      description: parentDescription,
      isRawMaterial: false,
      icon: parentIcon,
      imageUrl: parentImageUrl,
      children,
      isExpanded: false,
    };

    return currentNode;
  };

  // Start initial deconstruction
  const startDeconstruction = async () => {
    if (!identificationResult) return;

    setIsDeconstructing(true);
    setDeconstructionTree(null);

    try {
      const tree = await deconstructItem(
        identificationResult.name,
        identificationResult.brief_description,
        undefined,
        identificationResult.icon,
        imagePreview || identificationResult.imageUrl
      );
      setDeconstructionTree(tree);

      if (tree.children.length > 0) {
        fetchKnowledgeCard(tree, false);
      }
    } catch (error) {
      console.error('拆解错误:', error);
      alert('拆解失败，请重试');
    } finally {
      setIsDeconstructing(false);
    }
  };

  // Handle node click
  const handleNodeClick = async (nodeId: string, nodeName: string, parentContext?: string) => {
    if (loadingNodeIds.has(nodeId)) return;

    const findNode = (tree: TreeNode | null, id: string): TreeNode | null => {
      if (!tree) return null;
      if (tree.id === id) return tree;
      for (const child of tree.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
      return null;
    };

    const targetNode = findNode(deconstructionTree, nodeId);
    if (!targetNode || targetNode.isRawMaterial) return;

    if (targetNode.children.length > 0) {
      const isCurrentlyExpanded = targetNode.isExpanded;
      setDeconstructionTree(prevTree => {
        if (!prevTree) return null;
        const updateNode = (node: TreeNode): TreeNode => {
          if (node.id === nodeId) {
            return { ...node, isExpanded: !node.isExpanded };
          }
          return {
            ...node,
            children: node.children.map(updateNode),
          };
        };
        return updateNode(prevTree);
      });

      if (!isCurrentlyExpanded && !knowledgeCache.has(nodeId)) {
        fetchKnowledgeCard(targetNode, false);
      }
      return;
    }

    setLoadingNodeIds(prev => new Set(prev).add(nodeId));

    try {
      const response = await fetch('/api/deconstruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: nodeName,
          parentContext,
          promptOptions: {
            humorLevel,
            professionalLevel,
            customTemplate: promptMode === 'advanced' ? customPrompt : undefined
          }
        }),
      });

      if (!response.ok) {
        throw new Error('拆解失败');
      }

      const result: DeconstructionResult = await response.json();

      const children: TreeNode[] = result.parts.map(part => ({
        id: `${Date.now()}-${Math.random()}-${part.name}`,
        name: part.name,
        description: part.description,
        isRawMaterial: part.is_raw_material,
        icon: part.icon,
        imageUrl: part.imageUrl,
        children: [],
        isExpanded: false,
      }));

      setDeconstructionTree(prevTree => {
        if (!prevTree) return null;
        const updateNode = (node: TreeNode): TreeNode => {
          if (node.id === nodeId) {
            return { ...node, children, isExpanded: true };
          }
          return {
            ...node,
            children: node.children.map(updateNode),
          };
        };
        return updateNode(prevTree);
      });

      const updatedNode: TreeNode = {
        id: nodeId,
        name: nodeName,
        description: targetNode?.description || '',
        isRawMaterial: false,
        children,
        isExpanded: true
      };
      fetchKnowledgeCard(updatedNode, false);
    } catch (error) {
      console.error('拆解错误:', error);
      alert('拆解失败，请重试');
    } finally {
      setLoadingNodeIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    }
  };

  // Fetch knowledge card
  const fetchKnowledgeCard = async (node: TreeNode, showModal: boolean = true): Promise<void> => {
    if (!node.children || node.children.length === 0) return;

    if (knowledgeCache.has(node.id)) {
      if (showModal) {
        setKnowledgeCard({ node, data: knowledgeCache.get(node.id)! });
      }
      return;
    }

    if (loadingKnowledgeIds.has(node.id)) {
      return;
    }

    setLoadingKnowledgeIds(prev => new Set(prev).add(node.id));

    knowledgeRequestQueue.enqueue(async () => {
      if (showModal) {
        setLoadingKnowledge(true);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const response = await fetch('/api/knowledge-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentName: node.name,
            parentDescription: node.description,
            children: node.children.map(c => ({
              name: c.name,
              description: c.description,
              isRawMaterial: c.isRawMaterial
            }))
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('获取知识卡片失败');
        }

        const data: KnowledgeCardData = await response.json();

        setKnowledgeCache(prev => new Map(prev).set(node.id, data));

        if (showModal) {
          setKnowledgeCard({ node, data });
        }

      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.error('知识卡片请求超时 (120s):', node.name);
          if (showModal) {
            alert('获取知识卡片超时，请重试');
          }
        } else {
          console.error('知识卡片错误:', error);
          if (showModal) {
            alert('获取知识卡片失败，请重试');
          }
        }
      } finally {
        setLoadingKnowledgeIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(node.id);
          return newSet;
        });

        if (showModal) {
          setLoadingKnowledge(false);
        }
      }
    }, showModal);
  };

  // Return to setup page
  const returnToSetup = () => {
    router.push('/setup');
  };

  return (
    <div className={`min-h-screen p-8 relative overflow-hidden transition-colors duration-300 ${
      isDarkTheme
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white'
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-800'
    }`}>
      {/* 背景装饰 */}
      <div className={`absolute inset-0 tech-grid pointer-events-none transition-opacity duration-300 ${isDarkTheme ? 'opacity-30' : 'opacity-10'}`} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: isDarkTheme
          ? 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)'
          : 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Title area */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isDarkTheme
                ? 'bg-gradient-to-br from-cyan-500 to-cyan-700 shadow-lg shadow-cyan-500/30'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
            }`}>
              <span className="text-2xl">🌌</span>
            </div>
            <h1 className={`text-3xl font-bold bg-clip-text text-transparent transition-colors duration-300 ${
              isDarkTheme
                ? 'bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500'
                : 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600'
            }`}>
              操作界面
            </h1>
          </div>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkTheme ? 'text-cyan-300/60' : 'text-blue-600/80'
          }`}>
            探索万物本质 - 拆解图谱
          </p>
        </div>

        {/* Back to Setup Button */}
        <div className="mb-6">
          <button
            onClick={returnToSetup}
            className={`tech-btn ${isDarkTheme ? '' : 'tech-btn-light'} flex items-center gap-2`}
          >
            <span>←</span>
            <span>返回调制</span>
          </button>
        </div>

        {/* Identification Result Display */}
        {identificationResult && (
          <div className={`tech-card ${isDarkTheme ? '' : 'tech-card-light'} p-5 mb-6 ${isDarkTheme ? '' : 'bg-white/80'}`}>
            <div className="flex items-center gap-4">
              <div className="text-3xl">{identificationResult.icon || '📦'}</div>
              <div>
                <div className={`text-xl font-bold transition-colors duration-300 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>{identificationResult.name}</div>
                <div className={`text-sm transition-colors duration-300 ${isDarkTheme ? 'text-cyan-300/70' : 'text-blue-600/70'}`}>{identificationResult.brief_description}</div>
              </div>
            </div>
          </div>
        )}

        {/* Start Deconstruction Button */}
        {!deconstructionTree && identificationResult && (
          <div className={`tech-card ${isDarkTheme ? '' : 'tech-card-light'} p-8 mb-6 ${isDarkTheme ? '' : 'bg-white/80'}`}>
            <button
              onClick={startDeconstruction}
              disabled={isDeconstructing}
              className={`tech-btn ${isDarkTheme ? 'tech-btn-primary' : 'tech-btn-primary-light'} flex items-center gap-3 px-8 py-4 text-lg`}
            >
              {isDeconstructing ? (
                <>
                  <span className="inline-block animate-spin text-xl">⚡</span>
                  <span>AI 拆解中...</span>
                </>
              ) : (
                <>
                  <span>🔨</span>
                  <span>开始拆解</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Deconstruction Graph */}
        {deconstructionTree && (
          <div className="flex gap-6">
            {/* 左侧分解结构栏 */}
            <div className={`w-80 flex-shrink-0 tech-card ${isDarkTheme ? '' : 'tech-card-light'} p-4 max-h-[700px] overflow-hidden flex flex-col ${isDarkTheme ? '' : 'bg-white/80'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 transition-colors duration-300 ${isDarkTheme ? 'text-cyan-100' : 'text-slate-700'}`}>
                <span>📋</span>
                <span>分解结构</span>
              </h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <DecompositionTree
                  tree={deconstructionTree}
                  hoveredNodeId={hoveredNodeId}
                  onNodeHover={setHoveredNodeId}
                  breakdownMode={breakdownMode}
                  onProductionAnalysisClick={(node) => {
                    // 跳转到生产分析页面
                    const params = new URLSearchParams({
                      partName: node.name,
                      partId: node.id
                    });
                    router.push(`/production-analysis?${params.toString()}`);
                  }}
                  onNodeCollapse={(nodeId) => {
                    // 折叠节点
                    setDeconstructionTree(prevTree => {
                      if (!prevTree) return null;
                      const updateNode = (node: TreeNode): TreeNode => {
                        if (node.id === nodeId) {
                          return { ...node, isExpanded: false };
                        }
                        return { ...node, children: node.children.map(updateNode) };
                      };
                      return updateNode(prevTree);
                    });
                  }}
                  onNodeExpand={(nodeId) => {
                    // 展开节点（只是展开，不重新分解）
                    setDeconstructionTree(prevTree => {
                      if (!prevTree) return null;
                      const updateNode = (node: TreeNode): TreeNode => {
                        if (node.id === nodeId) {
                          return { ...node, isExpanded: true };
                        }
                        return { ...node, children: node.children.map(updateNode) };
                      };
                      return updateNode(prevTree);
                    });
                  }}
                  onNodeReexpand={(nodeId, nodeName, parentContext) => {
                    // 重新分解：先清空子节点再展开
                    setDeconstructionTree(prevTree => {
                      if (!prevTree) return null;
                      const updateNode = (node: TreeNode): TreeNode => {
                        if (node.id === nodeId) {
                          return { ...node, children: [], isExpanded: true };
                        }
                        return { ...node, children: node.children.map(updateNode) };
                      };
                      return updateNode(prevTree);
                    });
                    // 然后调用 handleNodeClick 重新分解
                    handleNodeClick(nodeId, nodeName, parentContext);
                  }}
                  onNodeClick={(node) => {
                    // 点击节点显示知识卡片
                    fetchKnowledgeCard(node, true);
                  }}
                />
              </div>
            </div>

            {/* 右侧图谱区域 */}
            <div className={`flex-1 tech-card ${isDarkTheme ? '' : 'tech-card-light'} p-6 ${isDarkTheme ? '' : 'bg-white/80'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-bold flex items-center gap-3 transition-colors duration-300 ${isDarkTheme ? 'text-cyan-100' : 'text-slate-700'}`}>
                <span className="text-3xl">🌌</span>
                <span>拆解图谱</span>
              </h2>
              <button
                onClick={() => {
                  const element = document.getElementById('graph-container');
                  if (element) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      element.requestFullscreen();
                    }
                  }
                }}
                className={`tech-btn ${isDarkTheme ? '' : 'tech-btn-light'} flex items-center gap-2 text-sm px-4 py-2`}
              >
                <span>🔍</span>
                <span>全屏</span>
              </button>
            </div>
            <div className={`mb-4 rounded-xl p-3 border transition-colors duration-300 ${
              isDarkTheme
                ? 'bg-cyan-950/30 border-cyan-500/30'
                : 'bg-blue-200 border-blue-300'
            }`}>
              <div className={`text-sm transition-colors duration-300 ${
                isDarkTheme ? 'text-cyan-300/70' : 'text-blue-600/70'
              }`}>
                点击节点继续拆解，青色节点是原材料。使用鼠标滚轮缩放，拖拽画布移动视图。
              </div>
            </div>
            <div id="graph-container" className="rounded-xl relative overflow-hidden">
              <GraphView
                tree={deconstructionTree}
                loadingNodeIds={loadingNodeIds}
                knowledgeCache={knowledgeCache}
                loadingKnowledgeIds={loadingKnowledgeIds}
                onNodeExpand={handleNodeClick}
                onShowKnowledge={(node) => fetchKnowledgeCard(node, true)}
                onNodePositionsChange={() => {
                  if (currentSessionId) {
                    console.log('节点位置已更改，触发数据库保存');
                    saveSessionToDatabase(false);
                  }
                }}
                edgeType={edgeType}
                hoveredNodeId={hoveredNodeId}
                isDarkTheme={isDarkTheme}
                onThemeChange={(newValue) => setIsDarkTheme(newValue)}
              />

              {/* Fullscreen knowledge card modal */}
              {knowledgeCard && isFullscreen && (
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100000] p-4"
                  onClick={() => setKnowledgeCard(null)}
                >
                  <div
                    className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 max-w-2xl w-full border-2 border-yellow-500/50 shadow-2xl max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <span>💡</span>
                        <span>知识卡片：{knowledgeCard.node.name}</span>
                      </h3>
                      <button
                        onClick={() => setKnowledgeCard(null)}
                        className="text-gray-400 hover:text-white text-2xl"
                      >
                        ✕
                      </button>
                    </div>

                    {loadingKnowledge ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-4xl animate-spin">🔄</span>
                          <span className="text-gray-400">正在生成知识卡片...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/30">
                          <div className="text-xl font-bold text-yellow-300">{knowledgeCard.data.title}</div>
                        </div>

                        <div className="space-y-4">
                          {knowledgeCard.data.steps.map((step, idx) => (
                            <div key={idx} className="relative">
                              <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-4 border-2 border-blue-500/50 hover:border-blue-400/70 transition-all">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg">
                                    {step.step_number}
                                  </div>

                                  <div className="flex-1">
                                    <div className="text-lg font-bold text-blue-300 mb-2">
                                      {step.action_title}
                                    </div>

                                    <div className="text-gray-300 text-sm mb-3">
                                      {highlightChildrenNames(
                                        step.description,
                                        knowledgeCard.node.children.map(c => c.name)
                                      )}
                                    </div>

                                    {step.parameters.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {step.parameters.map((param, pidx) => (
                                          <div key={pidx} className="bg-black/30 rounded px-3 py-1 text-xs border border-gray-600">
                                            <span className="text-gray-400">{param.label}:</span>
                                            <span className="text-white ml-1 font-semibold">{param.value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {idx < knowledgeCard.data.steps.length - 1 && (
                                <div className="flex justify-center my-2">
                                  <div className="text-3xl text-blue-400">↓</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                          <div className="text-sm text-blue-300 font-semibold mb-2">
                            📦 使用的组成部分
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {knowledgeCard.node.children.map((child, idx) => (
                              <div key={idx} className="bg-black/30 rounded-full px-3 py-1 text-sm border border-gray-600 flex items-center gap-1">
                                <span className="text-white">{child.name}</span>
                                {child.isRawMaterial && <span className="text-green-400 text-xs">🌿</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* Knowledge Card Modal (non-fullscreen) */}
        {knowledgeCard && !isFullscreen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100000] p-4"
            onClick={() => setKnowledgeCard(null)}
          >
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 max-w-2xl w-full border-2 border-yellow-500/50 shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <span>💡</span>
                  <span>知识卡片：{knowledgeCard.node.name}</span>
                </h3>
                <button
                  onClick={() => setKnowledgeCard(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {loadingKnowledge ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl animate-spin">🔄</span>
                    <span className="text-gray-400">正在生成知识卡片...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/30">
                    <div className="text-xl font-bold text-yellow-300">{knowledgeCard.data.title}</div>
                  </div>

                  <div className="space-y-4">
                    {knowledgeCard.data.steps.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-4 border-2 border-blue-500/50 hover:border-blue-400/70 transition-all">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg">
                              {step.step_number}
                            </div>

                            <div className="flex-1">
                              <div className="text-lg font-bold text-blue-300 mb-2">
                                {step.action_title}
                              </div>

                              <div className="text-gray-300 text-sm mb-3">
                                {highlightChildrenNames(
                                  step.description,
                                  knowledgeCard.node.children.map(c => c.name)
                                )}
                              </div>

                              {step.parameters.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {step.parameters.map((param, pidx) => (
                                    <div key={pidx} className="bg-black/30 rounded px-3 py-1 text-xs border border-gray-600">
                                      <span className="text-gray-400">{param.label}:</span>
                                      <span className="text-white ml-1 font-semibold">{param.value}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {idx < knowledgeCard.data.steps.length - 1 && (
                          <div className="flex justify-center my-2">
                            <div className="text-3xl text-blue-400">↓</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                    <div className="text-sm text-blue-300 font-semibold mb-2">
                      📦 使用的组成部分
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {knowledgeCard.node.children.map((child, idx) => (
                        <div key={idx} className="bg-black/30 rounded-full px-3 py-1 text-sm border border-gray-600 flex items-center gap-1">
                          <span className="text-white">{child.name}</span>
                          {child.isRawMaterial && <span className="text-green-400 text-xs">🌿</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoadingSession && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
                </div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  加载中...
                </h3>
                <p className="text-gray-400 mb-6">
                  正在加载拆解历史记录
                </p>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams support
export default function CanvasPage() {
  // Read theme from localStorage
  const isDarkTheme = typeof window !== 'undefined'
    ? (localStorage.getItem('theme') !== 'light')
    : true;

  return (
    <Suspense fallback={
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkTheme
          ? 'bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white'
          : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-800'
      }`}>
        <div className="text-center">
          <div className={`inline-block animate-spin rounded-full h-16 w-16 border-4 mb-4 transition-colors duration-300 ${
            isDarkTheme
              ? 'border-purple-500 border-t-transparent'
              : 'border-blue-500 border-t-transparent'
          }`}></div>
          <p className={isDarkTheme ? 'text-gray-400' : 'text-blue-600'}>加载中...</p>
        </div>
      </div>
    }>
      <CanvasContent />
    </Suspense>
  );
}
