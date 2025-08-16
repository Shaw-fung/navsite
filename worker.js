// worker.js
export default {
  async fetch(request, env) {
    // 将 KV 绑定到全局对象
    globalThis.NAV_DB = env.NAV_DB;
    
    const url = new URL(request.url);

    // 处理背景图片请求
    if (url.pathname === '/background-image') {
      return handleBackgroundImage(request);
    }

    // 处理 sea.webp 请求
    if (url.pathname === '/static/images/sea.webp') {
      return fetch('https://duibi.top/static/images/sea.webp');
    }

    // 处理 favicon.ico 请求
    if (url.pathname === '/favicon.ico') {
      return handleFavicon(request);
    }
    
    // Bing每日图片代理
    if (url.pathname === '/bing-image') {
      return fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1');
    }
    
    // 后台管理路由
    if (url.pathname.startsWith('/admin')) {
      return handleAdminRoutes(request);
    }
    
    // 处理API请求
    if (url.pathname.startsWith('/api')) {
      return handleApiRoutes(request);
    }
    
    // 数据库备份
    if (url.pathname === '/admin/backup') {
      return handleBackup(request);
    }
    
    // 数据库还原
    if (url.pathname === '/admin/restore' && request.method === 'POST') {
      return handleRestore(request);
    }
    
    // 前台页面
    return showFrontend(request);
  }
};

// 主请求处理
async function handleRequest(request) {
  // 此函数已整合到主fetch处理中
}

// 处理背景图片
async function handleBackgroundImage(request) {
  const settings = await getSiteSettings();
  
  // 使用自定义背景
  if (settings.backgroundType === 'custom' && settings.backgroundImage) {
    return fetch(settings.backgroundImage);
  }
  
  // 使用Bing每日图片
  if (settings.backgroundType === 'bing') {
    try {
      const bingResponse = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1');
      const bingData = await bingResponse.json();
      const imageUrl = 'https://www.bing.com' + bingData.images[0].url;
      return fetch(imageUrl);
    } catch (e) {
      console.error('Failed to fetch Bing image:', e);
    }
  }
  
  // 默认背景
  return fetch('https://duibi.top/static/images/sea.webp');
}

// 处理favicon
async function handleFavicon(request) {
  const settings = await getSiteSettings();
  
  if (settings.faviconUrl) {
    return fetch(settings.faviconUrl);
  }
  
  // 默认favicon
  return fetch('https://duibi.top/static/images/favicon.ico');
}

// 后台路由处理
async function handleAdminRoutes(request) {
  const url = new URL(request.url);
  
  // 管理员登录
  if (url.pathname === '/admin/login' && request.method === 'POST') {
    return handleAdminLogin(request);
  }
  
  // 管理员登出
  if (url.pathname === '/admin/logout') {
    return handleAdminLogout(request);
  }
  
  // 验证会话
  const isAuthenticated = await verifyAdminSession(request);
  
  // 登录页面
  if (url.pathname === '/admin/login') {
    if (isAuthenticated) {
      // 已登录用户访问登录页时重定向到仪表盘
      return Response.redirect(new URL('/admin/dashboard', request.url).toString(), 302);
    }
    return showAdminLogin();
  }

  // 未认证用户重定向到登录
  if (!isAuthenticated) {
    return Response.redirect(new URL('/admin/login', request.url).toString(), 302);
  }
  
  // 仪表盘
  if (url.pathname === '/admin/dashboard') {
    return showAdminDashboard();
  }
  
  // 分类管理
  if (url.pathname === '/admin/categories') {
    return showCategoryManagement();
  }
  
  // 链接管理
  if (url.pathname === '/admin/links') {
    return showLinkManagement();
  }
  
  // 管理后台Css
  if (url.pathname === '/admin/main.css') {
    return showAdminCss();
  }
  
  // 网站设置
  if (url.pathname === '/admin/settings') {
    return showSettingsPage();
  }
  
  // 添加分类
  if (url.pathname === '/admin/categories/add' && request.method === 'POST') {
    return handleAddCategory(request);
  }
  
  // 编辑分类
  if (url.pathname === '/admin/categories/edit' && request.method === 'POST') {
    return handleEditCategory(request);
  }
  
  // 删除分类
  if (url.pathname === '/admin/categories/delete' && request.method === 'POST') {
    return handleDeleteCategory(request);
  }
  
  // 添加链接
  if (url.pathname === '/admin/links/add' && request.method === 'POST') {
    return handleAddLink(request);
  }
  
  // 编辑链接
  if (url.pathname === '/admin/links/edit' && request.method === 'POST') {
    return handleEditLink(request);
  }
  
  // 删除链接
  if (url.pathname === '/admin/links/delete' && request.method === 'POST') {
    return handleDeleteLink(request);
  }
  
  // 更新设置
  if (url.pathname === '/admin/settings/update' && request.method === 'POST') {
    return handleUpdateSettings(request);
  }
  
  // 搜索引擎管理
  if (url.pathname === '/admin/search-engines') {
    return showSearchEngineManagement();
  }
  
  // 添加搜索引擎
  if (url.pathname === '/admin/search-engines/add' && request.method === 'POST') {
    return handleAddSearchEngine(request);
  }
  
  // 编辑搜索引擎
  if (url.pathname === '/admin/search-engines/edit' && request.method === 'POST') {
    return handleEditSearchEngine(request);
  }
  
  // 删除搜索引擎
  if (url.pathname === '/admin/search-engines/delete' && request.method === 'POST') {
    return handleDeleteSearchEngine(request);
  }
  
  // 数据备份
  if (url.pathname === '/admin/backup') {
    return showBackupPage();
  }
  
  // 数据还原页面
  if (url.pathname === '/admin/restore') {
    return showRestorePage();
  }
  
  return new Response('管理页面未找到', { status: 404 });
}

// API路由处理
async function handleApiRoutes(request) {
  const url = new URL(request.url);
  
  // 增加点击量
  if (url.pathname === '/api/click' && request.method === 'POST') {
    const data = await request.json();
    if (data.id) {
      await incrementClickCount(data.id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
        }
      });
    }
    return new Response(JSON.stringify({ error: '缺少ID参数' }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const isAuthenticated = await verifyAdminSession(request);

  // 未认证用户重定向到登录
  if (!isAuthenticated) {
    return Response.redirect(new URL('/admin/login', request.url).toString(), 302);
  }

  // 获取分类
  if (url.pathname === '/api/categories' && request.method === 'GET') {
    const categories = await getCategories();
    return new Response(JSON.stringify(categories), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // 获取链接
  if (url.pathname === '/api/links' && request.method === 'GET') {
    const links = await getLinks();
    return new Response(JSON.stringify(links), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // 获取网站设置
  if (url.pathname === '/api/site_settings' && request.method === 'GET') {
    const settings = await getSiteSettings();
    return new Response(JSON.stringify(settings), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // 获取搜索引擎
  if (url.pathname === '/api/search_engines' && request.method === 'GET') {
    const engines = await getSearchEngines();
    return new Response(JSON.stringify(engines), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  return new Response('API未找到', { status: 404 });
}

// 管理员登录处理
async function handleAdminLogin(request) {
  const formData = await request.formData();
  const username = formData.get('username');
  const password = formData.get('password');
  
  // 获取管理员凭据
  const settings = await getSiteSettings();
  
  if (username === settings.adminUsername && password === settings.adminPassword) {
    // 设置会话Cookie（有效期1小时） - 路径改为根路径
    const headers = new Headers({
      'Set-Cookie': `admin_session=true; Max-Age=3600; HttpOnly; Path=/; SameSite=Lax`,
      'Location': '/admin/dashboard'
    });
    return new Response(null, { status: 302, headers });
  }
  
  return new Response('用户名或密码错误', { status: 401 });
}

// 管理员登出
async function handleAdminLogout() {
  const headers = new Headers({
    'Set-Cookie': `admin_session=; Max-Age=0; HttpOnly; Path=/; SameSite=Lax`,
    'Location': '/admin/login'
  });
  return new Response(null, { status: 302, headers });
}

// 验证管理员会话
async function verifyAdminSession(request) {
  const cookieHeader = request.headers.get('Cookie');
  return cookieHeader && cookieHeader.includes('admin_session=true');
}

// 添加新链接
async function handleAddLink(request) {
  const formData = await request.formData();
  const title = formData.get('title');
  const url = formData.get('url');
  const icon = formData.get('icon') || '';
  const category = formData.get('category') || '未分类';
  const description = formData.get('description') || '';
  const isFeatured = formData.get('isFeatured') === 'on';
  
  if (!title || !url) {
    return new Response('标题和URL不能为空', { status: 400 });
  }
  
  try {
    // 获取现有链接
    const links = await getLinks();
    
    // 添加新链接
    links.push({ 
      id: Date.now().toString(),
      title, 
      url,
      icon,
      category,
      description,
      clicks: 0,
      isFeatured,
      createdAt: new Date().toISOString()
    });
    
    // 保存到KV
    await globalThis.NAV_DB.put('links', JSON.stringify(links));
    
    return Response.redirect(new URL('/admin/links', request.url).toString(), 303);
  } catch (error) {
    return new Response(`添加链接失败: ${error.message}`, { status: 500 });
  }
}

// 编辑链接
async function handleEditLink(request) {
  const formData = await request.formData();
  const id = formData.get('id');
  const title = formData.get('title');
  const url = formData.get('url');
  const icon = formData.get('icon');
  const category = formData.get('category');
  const description = formData.get('description');
  const isFeatured = formData.get('isFeatured') === 'on';
  
  if (!id || !title || !url || !category) {
    return new Response('所有字段都是必需的', { status: 400 });
  }
  
  try {
    // 获取现有链接
    const links = await getLinks();
    
    // 查找并更新链接
    const updatedLinks = links.map(link => {
      if (link.id === id) {
        return { 
          ...link, 
          title, 
          url, 
          icon: icon || link.icon,
          category,
          description: description || link.description,
          isFeatured
        };
      }
      return link;
    });
    
    // 保存到KV
    await globalThis.NAV_DB.put('links', JSON.stringify(updatedLinks));
    
    return Response.redirect(new URL('/admin/links', request.url).toString(), 303);
  } catch (error) {
    return new Response(`更新链接失败: ${error.message}`, { status: 500 });
  }
}

// 删除链接
async function handleDeleteLink(request) {
  const formData = await request.formData();
  const id = formData.get('id');
  
  if (!id) {
    return new Response('缺少ID参数', { status: 400 });
  }
  
  try {
    // 获取现有链接
    const links = await getLinks();
    
    // 过滤掉要删除的链接
    const updatedLinks = links.filter(link => link.id !== id);
    
    // 保存到KV
    await globalThis.NAV_DB.put('links', JSON.stringify(updatedLinks));
    
    return Response.redirect(new URL('/admin/links', request.url).toString(), 303);
  } catch (error) {
    return new Response(`删除链接失败: ${error.message}`, { status: 500 });
  }
}

// 添加分类
async function handleAddCategory(request) {
  const formData = await request.formData();
  const name = formData.get('name');
  const icon = formData.get('icon') || 'fa-folder';
  const isPrivate = formData.get('isPrivate') === 'on';
  
  if (!name) {
    return new Response('分类名称不能为空', { status: 400 });
  }
  
  try {
    // 获取现有分类
    const categories = await getCategories();
    
    // 检查是否已存在
    if (categories.some(cat => cat.name === name)) {
      return new Response('分类已存在', { status: 400 });
    }
    
    // 添加新分类
    categories.push({ name, icon, isPrivate });
    
    // 保存到KV
    await globalThis.NAV_DB.put('categories', JSON.stringify(categories));
    
    return Response.redirect(new URL('/admin/categories', request.url).toString(), 303);
  } catch (error) {
    return new Response(`添加分类失败: ${error.message}`, { status: 500 });
  }
}

// 编辑分类
async function handleEditCategory(request) {
  const formData = await request.formData();
  const oldName = formData.get('oldName');
  const newName = formData.get('newName');
  const newIcon = formData.get('icon');
  const isPrivate = formData.get('isPrivate') === 'on';
  
  if (!oldName || !newName) {
    return new Response('分类名称不能为空', { status: 400 });
  }
  
  try {
    // 获取现有分类
    const categories = await getCategories();
    
    // 检查新名称是否已存在
    if (oldName !== newName && categories.some(cat => cat.name === newName)) {
      return new Response('分类已存在', { status: 400 });
    }
    
    // 更新分类
    const updatedCategories = categories.map(cat => 
      cat.name === oldName ? { name: newName, icon: newIcon || cat.icon, isPrivate } : cat
    );
    
    // 更新所有链接中的分类
    const links = await getLinks();
    const updatedLinks = links.map(link => {
      if (link.category === oldName) {
        return { ...link, category: newName };
      }
      return link;
    });
    
    // 保存更新
    await globalThis.NAV_DB.put('categories', JSON.stringify(updatedCategories));
    await globalThis.NAV_DB.put('links', JSON.stringify(updatedLinks));
    
    return Response.redirect(new URL('/admin/categories', request.url).toString(), 303);
  } catch (error) {
    return new Response(`更新分类失败: ${error.message}`, { status: 500 });
  }
}

// 删除分类
async function handleDeleteCategory(request) {
  const formData = await request.formData();
  const name = formData.get('name');
  
  if (!name) {
    return new Response('分类名称不能为空', { status: 400 });
  }
  
  try {
    // 获取现有分类
    const categories = await getCategories();
    
    // 过滤掉要删除的分类
    const updatedCategories = categories.filter(cat => cat.name !== name);
    
    // 更新所有链接（将删除分类的链接移到默认分类）
    const links = await getLinks();
    const updatedLinks = links.map(link => {
      if (link.category === name) {
        return { ...link, category: '未分类' };
      }
      return link;
    });
    
    // 保存更新
    await globalThis.NAV_DB.put('categories', JSON.stringify(updatedCategories));
    await globalThis.NAV_DB.put('links', JSON.stringify(updatedLinks));
    
    return Response.redirect(new URL('/admin/categories', request.url).toString(), 303);
  } catch (error) {
    return new Response(`删除分类失败: ${error.message}`, { status: 500 });
  }
}

// 添加搜索引擎
async function handleAddSearchEngine(request) {
  const formData = await request.formData();
  const name = formData.get('name');
  const urlTemplate = formData.get('urlTemplate');
  
  if (!name || !urlTemplate) {
    return new Response('名称和URL模板不能为空', { status: 400 });
  }
  
  try {
    const engines = await getSearchEngines();
    engines.push({ name, urlTemplate });
    await globalThis.NAV_DB.put('search_engines', JSON.stringify(engines));
    
    return Response.redirect(new URL('/admin/search-engines', request.url).toString(), 303);
  } catch (error) {
    return new Response(`添加搜索引擎失败: ${error.message}`, { status: 500 });
  }
}

// 编辑搜索引擎
async function handleEditSearchEngine(request) {
  const formData = await request.formData();
  const oldName = formData.get('oldName');
  const newName = formData.get('newName');
  const urlTemplate = formData.get('urlTemplate');
  
  if (!oldName || !newName || !urlTemplate) {
    return new Response('所有字段都是必需的', { status: 400 });
  }
  
  try {
    const engines = await getSearchEngines();
    const updatedEngines = engines.map(engine => 
      engine.name === oldName ? { name: newName, urlTemplate } : engine
    );
    
    await globalThis.NAV_DB.put('search_engines', JSON.stringify(updatedEngines));
    
    return Response.redirect(new URL('/admin/search-engines', request.url).toString(), 303);
  } catch (error) {
    return new Response(`更新搜索引擎失败: ${error.message}`, { status: 500 });
  }
}

// 删除搜索引擎
async function handleDeleteSearchEngine(request) {
  const formData = await request.formData();
  const name = formData.get('name');
  
  if (!name) {
    return new Response('缺少名称参数', { status: 400 });
  }
  
  try {
    const engines = await getSearchEngines();
    const updatedEngines = engines.filter(engine => engine.name !== name);
    
    await globalThis.NAV_DB.put('search_engines', JSON.stringify(updatedEngines));
    
    return Response.redirect(new URL('/admin/search-engines', request.url).toString(), 303);
  } catch (error) {
    return new Response(`删除搜索引擎失败: ${error.message}`, { status: 500 });
  }
}

// 更新设置
async function handleUpdateSettings(request) {
  const formData = await request.formData();
  const siteTitle = formData.get('siteTitle');
  const siteDescription = formData.get('siteDescription');
  const copyright = formData.get('copyright');
  const icpNumber = formData.get('icpNumber');
  const adminUsername = formData.get('adminUsername');
  const adminPassword = formData.get('adminPassword');
  const backgroundType = formData.get('backgroundType') || 'default';
  const backgroundImage = formData.get('backgroundImage') || '';
  const faviconUrl = formData.get('faviconUrl') || '';
  
  if (!siteTitle || !adminUsername) {
    return new Response('网站标题和管理员用户名不能为空', { status: 400 });
  }
  
  try {
    // 获取现有设置
    const settings = await getSiteSettings();
    
    // 更新设置
    const updatedSettings = {
      ...settings,
      siteTitle,
      siteDescription: siteDescription || settings.siteDescription,
      copyright: copyright || settings.copyright,
      icpNumber: icpNumber || settings.icpNumber,
      adminUsername,
      adminPassword: adminPassword || settings.adminPassword,
      backgroundType,
      backgroundImage,
      faviconUrl
    };
    
    // 保存设置
    await globalThis.NAV_DB.put('site_settings', JSON.stringify(updatedSettings));
    
    return Response.redirect(new URL('/admin/settings', request.url).toString(), 303);
  } catch (error) {
    return new Response(`更新设置失败: ${error.message}`, { status: 500 });
  }
}

// 增加点击量
async function incrementClickCount(id) {
  try {
    const links = await getLinks();
    const updatedLinks = links.map(link => {
      if (link.id === id) {
        return { ...link, clicks: (link.clicks || 0) + 1 };
      }
      return link;
    });
    await globalThis.NAV_DB.put('links', JSON.stringify(updatedLinks));
  } catch (error) {
    console.error('增加点击量失败:', error);
  }
}

// 获取所有链接
async function getLinks() {
  try {
    const linksJson = await globalThis.NAV_DB.get('links');
    return linksJson ? JSON.parse(linksJson) : [];
  } catch (error) {
    console.error('获取链接失败:', error);
    return [];
  }
}

// 获取所有分类
async function getCategories() {
  try {
    const categoriesJson = await globalThis.NAV_DB.get('categories');
    return categoriesJson ? JSON.parse(categoriesJson) : [
      { name: '搜索引擎', icon: 'fa-search', isPrivate: false },
      { name: '综合名站', icon: 'fa-link', isPrivate: false }
    ];
  } catch (error) {
    console.error('获取分类失败:', error);
    return [
      { name: '搜索引擎', icon: 'fa-search', isPrivate: false },
      { name: '综合名站', icon: 'fa-link', isPrivate: false }
    ];
  }
}

// 获取所有搜索引擎
async function getSearchEngines() {
  try {
    const enginesJson = await globalThis.NAV_DB.get('search_engines');
    return enginesJson ? JSON.parse(enginesJson) : [
      { name: 'Google', urlTemplate: 'https://www.google.com/search?q={query}' },
      { name: 'Bing', urlTemplate: 'https://www.bing.com/search?q={query}' },
      { name: '百度', urlTemplate: 'https://www.baidu.com/s?wd={query}' },
      { name: 'Yandex', urlTemplate: 'https://yandex.com/search/?text={query}' }
    ];
  } catch (error) {
    console.error('获取搜索引擎失败:', error);
    return [
      { name: 'Google', urlTemplate: 'https://www.google.com/search?q={query}' },
      { name: 'Bing', urlTemplate: 'https://www.bing.com/search?q={query}' }
    ];
  }
}

// 获取网站设置
async function getSiteSettings() {
  try {
    const settingsJson = await globalThis.NAV_DB.get('site_settings');
    return settingsJson ? JSON.parse(settingsJson) : {
      siteTitle: '雪人导航网',
      siteDescription: '高效实用的网站导航',
      copyright: '© 2025 雪人导航网 版权所有',
      icpNumber: '湘ICP备12345678号',
      adminUsername: 'admin',
      adminPassword: 'admin123',
      backgroundType: 'default',
      backgroundImage: '',
      faviconUrl: ''
    };
  } catch (error) {
    console.error('获取网站设置失败:', error);
    return {
      siteTitle: '雪人导航网',
      siteDescription: '高效实用的网站导航',
      copyright: '© 2025 雪人导航网 版权所有',
      icpNumber: '湘ICP备12345678号',
      adminUsername: 'admin',
      adminPassword: 'admin123',
      backgroundType: 'default',
      backgroundImage: '',
      faviconUrl: ''
    };
  }
}

// 获取热门链接（按点击量排序）并过滤私有分类
async function getPopularLinks(limit = 10) {
  try {
    const links = await getLinks();
    const categories = await getCategories(); // 获取所有分类信息
    
    // 创建私有分类名称集合
    const privateCategories = new Set(
      categories
        .filter(cat => cat.isPrivate)
        .map(cat => cat.name)
    );
    
    return links
      .filter(link => !privateCategories.has(link.category)) // 过滤私有分类
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('获取热门链接失败:', error);
    return [];
  }
}

// 获取推荐链接
async function getFeaturedLinks(limit = 12) {
  try {
    const links = await getLinks();
    return links
      .filter(link => link.isFeatured)
      .slice(0, limit);
  } catch (error) {
    console.error('获取推荐链接失败:', error);
    return [];
  }
}

// 显示管理员登录页面
async function showAdminLogin() {
  const settings = await getSiteSettings();
  
  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>后台登录 - 导航系统</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      :root {
        --primary: #4361ee;
        --dark-primary: #3a56d4;
        --text: #333;
        --bg: #f8f9fa;
        --card-bg: #fff;
        --border: #e2e8f0;
        --shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        --radius: 16px;
      }
      
      body.dark-mode {
        --text: #e2e8f0;
        --bg: #121826;
        --card-bg: #1e293b;
        --border: #334155;
        --shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
      
      body {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: var(--text);
        transition: background 0.3s, color 0.3s;
      }
      
      .login-container {
        background: var(--card-bg);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        width: 100%;
        max-width: 450px;
        padding: 40px;
        text-align: center;
        transition: all 0.3s;
      }
      
      .login-header {
        margin-bottom: 30px;
      }
      
      .login-header h1 {
        font-size: 28px;
        color: var(--primary);
        margin-bottom: 10px;
      }
      
      .login-header p {
        color: var(--text);
        opacity: 0.8;
        font-size: 16px;
      }
      
      .form-group {
        margin-bottom: 25px;
        text-align: left;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: var(--text);
        font-size: 14px;
      }
      
      .form-group input {
        width: 100%;
        padding: 14px 16px;
        border: 2px solid var(--border);
        border-radius: 10px;
        font-size: 16px;
        background: var(--card-bg);
        color: var(--text);
        transition: all 0.3s;
      }
      
      .form-group input:focus {
        border-color: var(--primary);
        outline: none;
        box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
      }
      
      .login-btn {
        background: var(--primary);
        color: white;
        border: none;
        padding: 15px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        width: 100%;
        transition: all 0.3s;
        margin-top: 10px;
      }
      
      .login-btn:hover {
        background: var(--dark-primary);
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      }
      
      .footer {
        margin-top: 25px;
        color: var(--text);
        opacity: 0.7;
        font-size: 14px;
      }
      
      .theme-toggle {
        position: absolute;
        top: 20px;
        right: 20px;
        background: var(--card-bg);
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: var(--shadow);
        color: var(--text);
      }
    </style>
  </head>
  <body>
    <button class="theme-toggle" id="themeToggle">
      <i class="fas fa-moon"></i>
    </button>
    
    <div class="login-container">
      <div class="login-header">
        <h1><i class="fas fa-compass"></i> 导航系统</h1>
        <p>管理员登录</p>
      </div>
      
      <form method="POST" action="/admin/login">
        <div class="form-group">
          <label for="username"><i class="fas fa-user"></i> 用户名</label>
          <input type="text" id="username" name="username" required>
        </div>
        
        <div class="form-group">
          <label for="password"><i class="fas fa-lock"></i> 密码</label>
          <input type="password" id="password" name="password" required>
        </div>
        
        <button type="submit" class="login-btn">登录</button>
      </form>
      
      <div class="footer">
        <p>${settings.copyright}</p>
      </div>
    </div>
    
    <script>
      const themeToggle = document.getElementById('themeToggle');
      const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
      
      // 检查本地存储或系统偏好
      const currentTheme = localStorage.getItem('theme') || 
                          (prefersDarkScheme.matches ? 'dark' : 'light');
      
      if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      }
      
      themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
          localStorage.setItem('theme', 'dark');
          themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
          localStorage.setItem('theme', 'light');
          themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
      });
    </script>
  </body>
  </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// 显示管理员仪表盘
async function showAdminDashboard() {
  const links = await getLinks();
  const categories = await getCategories();
  
  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>仪表盘 - 导航系统</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/admin/main.css">
  </head>
  <body>
    <!-- 添加遮罩层 -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <!-- 侧边栏 -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-close" id="sidebarClose">
        <i class="fas fa-times"></i>
      </div>
      <div class="sidebar-header">
        <h1><i class="fas fa-compass"></i> 导航系统</h1>
      </div>
      <ul class="nav-links">
        <li><a href="/admin/dashboard" class="active"><i class="fas fa-tachometer-alt"></i> 仪表盘</a></li>
        <li><a href="/admin/links"><i class="fas fa-link"></i> 链接管理</a></li>
        <li><a href="/admin/categories"><i class="fas fa-folder"></i> 分类管理</a></li>
        <li><a href="/admin/search-engines"><i class="fas fa-search"></i> 搜索引擎</a></li>
        <li><a href="/admin/settings"><i class="fas fa-cog"></i> 系统设置</a></li>
        <li><a href="/admin/backup"><i class="fas fa-database"></i> 数据备份</a></li>
      </ul>
    </div>
    
    <!-- 主内容 -->
    <div class="main-content">
      <div class="header">
        <!-- 添加菜单按钮 -->
        <div class="menu-toggle" id="menuToggle">
          <i class="fas fa-bars"></i>
        </div>
        <h2>仪表盘</h2>
        <div class="user-menu">
          <div class="user-avatar">A</div>
          <a href="/admin/logout" class="logout-btn"><i class="fas fa-sign-out-alt"></i> 退出</a>
        </div>
      </div>
      
      <div class="dashboard-cards">
        <div class="card">
          <div class="card-header">
            <div class="card-icon links">
              <i class="fas fa-link"></i>
            </div>
            <div>
              <div class="card-title">链接总数</div>
              <div class="card-value">${links.length}</div>
            </div>
          </div>
          <div class="card-actions">
            <a href="/admin/links" class="btn btn-primary"><i class="fas fa-plus"></i> 添加新链接</a>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <div class="card-icon categories">
              <i class="fas fa-folder"></i>
            </div>
            <div>
              <div class="card-title">分类数量</div>
              <div class="card-value">${categories.length}</div>
            </div>
          </div>
          <div class="card-actions">
            <a href="/admin/categories" class="btn btn-primary"><i class="fas fa-plus"></i> 管理分类</a>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <div class="card-icon settings">
              <i class="fas fa-cog"></i>
            </div>
            <div>
              <div class="card-title">系统设置</div>
              <div class="card-value">管理员</div>
            </div>
          </div>
          <div class="card-actions">
            <a href="/admin/settings" class="btn btn-primary"><i class="fas fa-cog"></i> 修改设置</a>
          </div>
        </div>
      </div>
      
      <div class="recent-links">
        <h3>最近添加的链接</h3>
        ${links.slice(-5).reverse().map(link => `
          <div class="link-item">
            <div class="link-icon">
              ${link.icon.startsWith('http') ? 
                `<img src="${link.icon}" alt="icon" style="width:24px;height:24px;">` : 
                `<i class="fas ${link.icon || 'fa-globe'}"></i>`}
            </div>
            <div class="link-info">
              <div class="link-title">${link.title}</div>
              <div class="link-url">${link.url}</div>
            </div>
            <div class="link-category">${link.category}</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <script>
      // 侧边栏控制逻辑
      const menuToggle = document.getElementById('menuToggle');
      const sidebar = document.getElementById('sidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      const sidebarClose = document.getElementById('sidebarClose');
      
      // 切换侧边栏状态
      function toggleSidebar() {
        sidebar.classList.toggle('sidebar-active');
        sidebarOverlay.classList.toggle('sidebar-active');
        
        // 添加/移除body滚动锁定
        if (sidebar.classList.contains('sidebar-active')) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
      
      // 关闭侧边栏
      function closeSidebar() {
        sidebar.classList.remove('sidebar-active');
        sidebarOverlay.classList.remove('sidebar-active');
        document.body.style.overflow = '';
      }
      
      // 事件监听
      menuToggle.addEventListener('click', toggleSidebar);
      sidebarOverlay.addEventListener('click', closeSidebar);
      sidebarClose.addEventListener('click', closeSidebar);
      
      // 点击侧边栏外部关闭
      document.addEventListener('click', (event) => {
        if (window.innerWidth > 992) return;
        
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnMenuToggle = menuToggle.contains(event.target);
        
        if (!isClickInsideSidebar && !isClickOnMenuToggle && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      // 键盘ESC键关闭
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      // 窗口大小变化时调整
      window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
          // 大屏幕时确保侧边栏可见
          sidebar.classList.remove('sidebar-active');
          sidebarOverlay.classList.remove('sidebar-active');
          document.body.style.overflow = '';
        } else {
          // 小屏幕时默认隐藏
          closeSidebar();
        }
      });
    </script>
  </body>
  </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// 显示链接管理页面
async function showLinkManagement() {
  const links = await getLinks();
  const categories = await getCategories();
  
  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>链接管理 - 导航系统</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/admin/main.css">
  </head>
  <body>
    <!-- 添加遮罩层 -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <!-- 侧边栏 -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-close" id="sidebarClose">
        <i class="fas fa-times"></i>
      </div>
      <div class="sidebar-header">
        <h1><i class="fas fa-compass"></i> 导航系统</h1>
      </div>
      <ul class="nav-links">
        <li><a href="/admin/dashboard"><i class="fas fa-tachometer-alt"></i> 仪表盘</a></li>
        <li><a href="/admin/links" class="active"><i class="fas fa-link"></i> 链接管理</a></li>
        <li><a href="/admin/categories"><i class="fas fa-folder"></i> 分类管理</a></li>
        <li><a href="/admin/search-engines"><i class="fas fa-search"></i> 搜索引擎</a></li>
        <li><a href="/admin/settings"><i class="fas fa-cog"></i> 系统设置</a></li>
        <li><a href="/admin/backup"><i class="fas fa-database"></i> 数据备份</a></li>
      </ul>
    </div>
    
    <!-- 主内容 -->
    <div class="main-content">
      <div class="header">
        <!-- 添加菜单按钮 -->
        <div class="menu-toggle" id="menuToggle">
          <i class="fas fa-bars"></i>
        </div>
        <h2>链接管理</h2>
        <div class="user-menu">
          <div class="user-avatar">A</div>
          <a href="/admin/logout" class="logout-btn"><i class="fas fa-sign-out-alt"></i> 退出</a>
        </div>
      </div>
      
      <div class="content-header">
        <h2><i class="fas fa-link"></i> 所有链接</h2>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>标题</th>
            <th>URL</th>
            <th>分类</th>
            <th>点击量</th>
            <th>推荐</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${links.map(link => `
            <tr>
              <td>
                ${link.icon.startsWith('http') ? 
                  `<img src="${link.icon}" alt="icon" style="width:24px;height:24px;">` : 
                  `<i class="fas ${link.icon || 'fa-globe'}"></i>`}
                ${link.title}
              </td>
              <td><a href="${link.url}" target="_blank">${link.url}</a></td>
              <td><span class="badge badge-primary">${link.category}</span></td>
              <td>${link.clicks || 0}</td>
              <td>${link.isFeatured ? '<i class="fas fa-star" style="color: gold;"></i>' : ''}</td>
              <td class="action-buttons">
                <button class="btn btn-edit btn-sm" onclick="openEditModal('${link.id}')">
                  <i class="fas fa-edit"></i> 编辑
                </button>
                <form method="POST" action="/admin/links/delete" style="display:inline;">
                  <input type="hidden" name="id" value="${link.id}">
                  <button type="submit" class="btn btn-delete btn-sm">
                    <i class="fas fa-trash"></i> 删除
                  </button>
                </form>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="add-link-form">
        <h3><i class="fas fa-plus-circle"></i> 添加新链接</h3>
        <form method="POST" action="/admin/links/add">
          <div class="form-grid">
            <div class="form-group">
              <label for="title">网站标题</label>
              <input type="text" id="title" name="title" required>
            </div>
            
            <div class="form-group">
              <label for="url">网站URL</label>
              <input type="url" id="url" name="url" required>
            </div>
            
            <div class="form-group">
              <label for="icon">图标 (图片URL或Font Awesome类名)</label>
              <input type="text" id="icon" name="icon" placeholder="fa-globe 或 https://example.com/icon.png">
            </div>
            
            <div class="form-group">
              <label for="category">分类</label>
              <select id="category" name="category" required>
                ${categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="description">描述</label>
            <input type="text" id="description" name="description">
          </div>
          
          <div class="form-group">
            <label for="featured">
              <input type="checkbox" id="featured" name="isFeatured"> 是否推荐
            </label>
          </div>
          
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> 添加链接
          </button>
        </form>
      </div>
    </div>
    
    <!-- 编辑链接模态框 -->
    <div class="modal" id="editModal">
      <div class="modal-content">
        <h3 style="margin-bottom:20px; font-size:20px;"><i class="fas fa-edit"></i> 编辑链接</h3>
        <form method="POST" action="/admin/links/edit" id="editForm">
          <input type="hidden" name="id" id="editId">
          <div class="form-group">
            <label for="editTitle">网站标题</label>
            <input type="text" id="editTitle" name="title" required>
          </div>
          
          <div class="form-group">
            <label for="editUrl">网站URL</label>
            <input type="url" id="editUrl" name="url" required>
          </div>
          
          <div class="form-group">
            <label for="editIcon">图标 (图片URL或Font Awesome类名)</label>
            <input type="text" id="editIcon" name="icon">
          </div>
          
          <div class="form-group">
            <label for="editCategory">分类</label>
            <select id="editCategory" name="category" required>
              ${categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label for="editDescription">描述</label>
            <input type="text" id="editDescription" name="description">
          </div>
          
          <div class="form-group">
            <label for="editFeatured">
              <input type="checkbox" id="editFeatured" name="isFeatured"> 是否推荐
            </label>
          </div>
          
          <div style="display:flex; gap:10px; margin-top:20px;">
            <button type="button" class="btn" style="background:var(--gray);" onclick="closeEditModal()">取消</button>
            <button type="submit" class="btn btn-primary">保存更改</button>
          </div>
        </form>
      </div>
    </div>
    
    <script>
      function openEditModal(id) {
        const links = ${JSON.stringify(links)};
        const link = links.find(l => l.id === id);
        if (link) {
          document.getElementById('editId').value = link.id;
          document.getElementById('editTitle').value = link.title;
          document.getElementById('editUrl').value = link.url;
          document.getElementById('editIcon').value = link.icon || '';
          document.getElementById('editCategory').value = link.category;
          document.getElementById('editDescription').value = link.description || '';
          document.getElementById('editFeatured').checked = link.isFeatured || false;
          document.getElementById('editModal').style.display = 'flex';
        }
      }
      
      function closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
      }
      
      // 点击模态框外部关闭
      document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
      });
      
      // 侧边栏控制逻辑（与仪表盘页面相同）
      const menuToggle = document.getElementById('menuToggle');
      const sidebar = document.getElementById('sidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      const sidebarClose = document.getElementById('sidebarClose');
      
      function toggleSidebar() {
        sidebar.classList.toggle('sidebar-active');
        sidebarOverlay.classList.toggle('sidebar-active');
        
        if (sidebar.classList.contains('sidebar-active')) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
      
      function closeSidebar() {
        sidebar.classList.remove('sidebar-active');
        sidebarOverlay.classList.remove('sidebar-active');
        document.body.style.overflow = '';
      }
      
      menuToggle.addEventListener('click', toggleSidebar);
      sidebarOverlay.addEventListener('click', closeSidebar);
      sidebarClose.addEventListener('click', closeSidebar);
      
      document.addEventListener('click', (event) => {
        if (window.innerWidth > 992) return;
        
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnMenuToggle = menuToggle.contains(event.target);
        
        if (!isClickInsideSidebar && !isClickOnMenuToggle && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
          closeSidebar();
        }
      });
    </script>
  </body>
  </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// 显示分类管理页面
async function showCategoryManagement() {
  const categories = await getCategories();
  
  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>分类管理 - 导航系统</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/admin/main.css">
  </head>
  <body>
    <!-- 添加遮罩层 -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <!-- 侧边栏 -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-close" id="sidebarClose">
        <i class="fas fa-times"></i>
      </div>
      <div class="sidebar-header">
        <h1><i class="fas fa-compass"></i> 导航系统</h1>
      </div>
      <ul class="nav-links">
        <li><a href="/admin/dashboard"><i class="fas fa-tachometer-alt"></i> 仪表盘</a></li>
        <li><a href="/admin/links"><i class="fas fa-link"></i> 链接管理</a></li>
        <li><a href="/admin/categories" class="active"><i class="fas fa-folder"></i> 分类管理</a></li>
        <li><a href="/admin/search-engines"><i class="fas fa-search"></i> 搜索引擎</a></li>
        <li><a href="/admin/settings"><i class="fas fa-cog"></i> 系统设置</a></li>
        <li><a href="/admin/backup"><i class="fas fa-database"></i> 数据备份</a></li>
      </ul>
    </div>
    
    <!-- 主内容 -->
    <div class="main-content">
      <div class="header">
        <!-- 添加菜单按钮 -->
        <div class="menu-toggle" id="menuToggle">
          <i class="fas fa-bars"></i>
        </div>
        <h2>分类管理</h2>
        <div class="user-menu">
          <div class="user-avatar">A</div>
          <a href="/admin/logout" class="logout-btn"><i class="fas fa-sign-out-alt"></i> 退出</a>
        </div>
      </div>
      
      <div class="content-header">
        <h2><i class="fas fa-folder"></i> 所有分类</h2>
      </div>
      
      <div class="categories-container">
        ${categories.map(category => `
          <div class="category-card">
            <div class="category-header">
              <div class="category-icon">
                <i class="fas ${category.icon}"></i>
              </div>
              <div class="category-name">${category.name}</div>
              <div class="badge ${category.isPrivate ? 'badge-warning' : 'badge-primary'}">
                ${category.isPrivate ? '私有' : '公开'}
              </div>
            </div>
            <div class="category-actions">
              <button class="btn btn-edit btn-sm" onclick="openEditCategoryModal('${category.name}', '${category.icon}', ${category.isPrivate})">
                <i class="fas fa-edit"></i> 编辑
              </button>
              <form method="POST" action="/admin/categories/delete" style="display:inline;">
                <input type="hidden" name="name" value="${category.name}">
                <button type="submit" class="btn btn-delete btn-sm">
                  <i class="fas fa-trash"></i> 删除
                </button>
              </form>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="add-category-form">
        <h3><i class="fas fa-plus-circle"></i> 添加新分类</h3>
        <form method="POST" action="/admin/categories/add">
          <div class="form-group">
            <label for="name">分类名称</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div class="form-group">
            <label for="icon">图标</label>
            <input type="text" id="icon" name="icon" placeholder="fa-folder">
          </div>
          <div class="form-group">
            <label for="isPrivate">
              <input type="checkbox" id="isPrivate" name="isPrivate"> 私有分类（登录可见）
            </label>
          </div>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> 添加分类
          </button>
        </form>
      </div>
    </div>
    
    <!-- 编辑分类模态框 -->
    <div class="modal" id="editCategoryModal">
      <div class="modal-content">
        <h3 style="margin-bottom:20px; font-size:20px;"><i class="fas fa-edit"></i> 编辑分类</h3>
        <form method="POST" action="/admin/categories/edit">
          <input type="hidden" name="oldName" id="editOldName">
          <div class="form-group">
            <label for="editNewName">新分类名称</label>
            <input type="text" id="editNewName" name="newName" required>
          </div>
          <div class="form-group">
            <label for="editIcon">图标</label>
            <input type="text" id="editIcon" name="icon">
          </div>
          <div class="form-group">
            <label for="editIsPrivate">
              <input type="checkbox" id="editIsPrivate" name="isPrivate"> 私有分类（登录可见）
            </label>
          </div>
          <div style="display:flex; gap:10px; margin-top:20px;">
            <button type="button" class="btn" style="background:var(--gray);" onclick="closeEditCategoryModal()">取消</button>
            <button type="submit" class="btn btn-primary">保存更改</button>
          </div>
        </form>
      </div>
    </div>
    
    <script>
      function openEditCategoryModal(name, icon, isPrivate) {
        document.getElementById('editOldName').value = name;
        document.getElementById('editNewName').value = name;
        document.getElementById('editIcon').value = icon || '';
        document.getElementById('editIsPrivate').checked = isPrivate || false;
        document.getElementById('editCategoryModal').style.display = 'flex';
      }
      
      function closeEditCategoryModal() {
        document.getElementById('editCategoryModal').style.display = 'none';
      }
      
      // 点击模态框外部关闭
      document.getElementById('editCategoryModal').addEventListener('click', function(e) {
        if (e.target === this) closeEditCategoryModal();
      });
      
      // 侧边栏控制逻辑（与仪表盘页面相同）
      const menuToggle = document.getElementById('menuToggle');
      const sidebar = document.getElementById('sidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      const sidebarClose = document.getElementById('sidebarClose');
      
      function toggleSidebar() {
        sidebar.classList.toggle('sidebar-active');
        sidebarOverlay.classList.toggle('sidebar-active');
        
        if (sidebar.classList.contains('sidebar-active')) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
      
      function closeSidebar() {
        sidebar.classList.remove('sidebar-active');
        sidebarOverlay.classList.remove('sidebar-active');
        document.body.style.overflow = '';
      }
      
      menuToggle.addEventListener('click', toggleSidebar);
      sidebarOverlay.addEventListener('click', closeSidebar);
      sidebarClose.addEventListener('click', closeSidebar);
      
      document.addEventListener('click', (event) => {
        if (window.innerWidth > 992) return;
        
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnMenuToggle = menuToggle.contains(event.target);
        
        if (!isClickInsideSidebar && !isClickOnMenuToggle && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
          closeSidebar();
        }
      });
    </script>
  </body>
  </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// 显示搜索引擎管理页面
async function showSearchEngineManagement() {
  const engines = await getSearchEngines();
  
  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>搜索引擎管理 - 导航系统</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/admin/main.css">
  </head>
  <body>
    <!-- 添加遮罩层 -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <!-- 侧边栏 -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-close" id="sidebarClose">
        <i class="fas fa-times"></i>
      </div>
      <div class="sidebar-header">
        <h1><i class="fas fa-compass"></i> 导航系统</h1>
      </div>
      <ul class="nav-links">
        <li><a href="/admin/dashboard"><i class="fas fa-tachometer-alt"></i> 仪表盘</a></li>
        <li><a href="/admin/links"><i class="fas fa-link"></i> 链接管理</a></li>
        <li><a href="/admin/categories"><i class="fas fa-folder"></i> 分类管理</a></li>
        <li><a href="/admin/search-engines" class="active"><i class="fas fa-search"></i> 搜索引擎</a></li>
        <li><a href="/admin/settings"><i class="fas fa-cog"></i> 系统设置</a></li>
        <li><a href="/admin/backup"><i class="fas fa-database"></i> 数据备份</a></li>
      </ul>
    </div>
    
    <!-- 主内容 -->
    <div class="main-content">
      <div class="header">
        <!-- 添加菜单按钮 -->
        <div class="menu-toggle" id="menuToggle">
          <i class="fas fa-bars"></i>
        </div>
        <h2>搜索引擎管理</h2>
        <div class="user-menu">
          <div class="user-avatar">A</div>
          <a href="/admin/logout" class="logout-btn"><i class="fas fa-sign-out-alt"></i> 退出</a>
        </div>
      </div>
      
      <div class="content-header">
        <h2><i class="fas fa-search"></i> 搜索引擎列表</h2>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>URL模板</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${engines.map(engine => `
            <tr>
              <td>${engine.name}</td>
              <td>${engine.urlTemplate}</td>
              <td class="action-buttons">
                <button class="btn btn-edit btn-sm" onclick="openEditModal('${engine.name}')">
                  <i class="fas fa-edit"></i> 编辑
                </button>
                <form method="POST" action="/admin/search-engines/delete" style="display:inline;">
                  <input type="hidden" name="name" value="${engine.name}">
                  <button type="submit" class="btn btn-delete btn-sm">
                    <i class="fas fa-trash"></i> 删除
                  </button>
                </form>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="add-engine-form">
        <h3><i class="fas fa-plus-circle"></i> 添加新搜索引擎</h3>
        <form method="POST" action="/admin/search-engines/add">
          <div class="form-grid">
            <div class="form-group">
              <label for="name">引擎名称</label>
              <input type="text" id="name" name="name" required>
            </div>
            
            <div class="form-group">
              <label for="urlTemplate">URL模板</label>
              <input type="text" id="urlTemplate" name="urlTemplate" placeholder="https://example.com/search?q={query}" required>
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> 添加引擎
          </button>
        </form>
      </div>
    </div>
    
    <!-- 编辑模态框 -->
    <div class="modal" id="editModal">
      <div class="modal-content">
        <h3 style="margin-bottom:20px; font-size:20px;"><i class="fas fa-edit"></i> 编辑搜索引擎</h3>
        <form method="POST" action="/admin/search-engines/edit" id="editForm">
          <input type="hidden" name="oldName" id="editOldName">
          <div class="form-group">
            <label for="editName">引擎名称</label>
            <input type="text" id="editName" name="newName" required>
          </div>
          
          <div class="form-group">
            <label for="editUrlTemplate">URL模板</label>
            <input type="text" id="editUrlTemplate" name="urlTemplate" required>
          </div>
          
          <div style="display:flex; gap:10px; margin-top:20px;">
            <button type="button" class="btn" style="background:var(--gray);" onclick="closeEditModal()">取消</button>
            <button type="submit" class="btn btn-primary">保存更改</button>
          </div>
        </form>
      </div>
    </div>
    
    <script>
      function openEditModal(name) {
        const engines = ${JSON.stringify(engines)};
        const engine = engines.find(e => e.name === name);
        if (engine) {
          document.getElementById('editOldName').value = engine.name;
          document.getElementById('editName').value = engine.name;
          document.getElementById('editUrlTemplate').value = engine.urlTemplate;
          document.getElementById('editModal').style.display = 'flex';
        }
      }
      
      function closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
      }
      
      // 点击模态框外部关闭
      document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
      });
      
      // 侧边栏控制逻辑（与仪表盘页面相同）
      const menuToggle = document.getElementById('menuToggle');
      const sidebar = document.getElementById('sidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      const sidebarClose = document.getElementById('sidebarClose');
      
      function toggleSidebar() {
        sidebar.classList.toggle('sidebar-active');
        sidebarOverlay.classList.toggle('sidebar-active');
        
        if (sidebar.classList.contains('sidebar-active')) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
      
      function closeSidebar() {
        sidebar.classList.remove('sidebar-active');
        sidebarOverlay.classList.remove('sidebar-active');
        document.body.style.overflow = '';
      }
      
      menuToggle.addEventListener('click', toggleSidebar);
      sidebarOverlay.addEventListener('click', closeSidebar);
      sidebarClose.addEventListener('click', closeSidebar);
      
      document.addEventListener('click', (event) => {
        if (window.innerWidth > 992) return;
        
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnMenuToggle = menuToggle.contains(event.target);
        
        if (!isClickInsideSidebar && !isClickOnMenuToggle && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
          closeSidebar();
        }
      });
    </script>
  </body>
  </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// 管理页面CSS
async function showAdminCss() {
  const css = `
  :root {
    --primary: #4361ee;
    --secondary: #3f37c9;
    --accent: #4895ef;
    --light: #f8f9fa;
    --dark: #212529;
    --success: #2a9d8f;
    --warning: #f4a261;
    --danger: #e63946;
    --gray: #6c757d;
    --light-gray: #e9ecef;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  body {
    background-color: #f5f7fb;
    color: var(--dark);
    display: flex;
    min-height: 100vh;
  }
  
  /* 侧边栏样式 */
  .sidebar {
    width: 250px;
    background: linear-gradient(180deg, var(--primary) 0%, var(--secondary) 100%);
    color: white;
    height: 100vh;
    position: fixed;
    padding: 20px 0;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    transition: transform 0.3s ease;
  }
  
  .sidebar-header {
    padding: 0 20px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 20px;
  }
  
  .sidebar-header h1 {
    font-size: 24px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .sidebar-header h1 i {
    font-size: 28px;
  }
  
  .nav-links {
    list-style: none;
    padding: 0;
  }
  
  .nav-links li {
    margin-bottom: 5px;
  }
  
  .nav-links a {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    transition: all 0.3s;
    font-size: 16px;
    gap: 12px;
  }
  
  .nav-links a:hover, .nav-links a.active {
    background: rgba(255,255,255,0.1);
    color: white;
    border-left: 4px solid white;
  }
  
  .nav-links a i {
    width: 24px;
    text-align: center;
  }
  
  /* 主内容区域 */
  .main-content {
    flex: 1;
    margin-left: 250px;
    padding: 30px;
    width: calc(100% - 250px);
    transition: margin-left 0.3s ease;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--light-gray);
  }
  
  .header h2 {
    font-size: 24px;
    color: var(--dark);
    margin: 0;
  }
  
  .user-menu {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  
  .logout-btn {
    background: var(--danger);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    font-weight: 500;
    text-decoration: none;
  }
  
  /* 卡片样式 */
  .dashboard-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    padding: 25px;
    transition: transform 0.3s;
  }
  
  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .card-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
  }
  
  .card-icon.links {
    background: linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%);
  }
  
  .card-icon.categories {
    background: linear-gradient(135deg, var(--success) 0%, #2a9d8f 100%);
  }
  
  .card-icon.settings {
    background: linear-gradient(135deg, var(--warning) 0%, #f4a261 100%);
  }
  
  .card-icon i {
    font-size: 24px;
    color: white;
  }
  
  .card-title {
    font-size: 16px;
    color: var(--gray);
    font-weight: 500;
    margin: 0;
  }
  
  .card-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--dark);
    margin-top: 5px;
    margin-bottom: 0;
  }
  
  .card-actions {
    margin-top: 20px;
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.3s;
    border: none;
  }
  
  .btn-primary {
    background: var(--primary);
    color: white;
  }
  
  .btn-primary:hover {
    background: var(--secondary);
  }
  
  .recent-links {
    background: white;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    padding: 25px;
    margin-top: 30px;
  }
  
  .recent-links h3 {
    font-size: 20px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--light-gray);
  }
  
  .link-item {
    display: flex;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid var(--light-gray);
  }
  
  .link-item:last-child {
    border-bottom: none;
  }
  
  .link-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--light);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    color: var(--primary);
  }
  
  .link-info {
    flex: 1;
  }
  
  .link-title {
    font-weight: 600;
    margin-bottom: 5px;
  }
  
  .link-url {
    font-size: 14px;
    color: var(--gray);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .link-category {
    background: var(--light);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    color: var(--dark);
  }
  
  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
  }
  
  .content-header h2 {
    font-size: 24px;
    margin: 0;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  thead {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    color: white;
  }
  
  th, td {
    padding: 16px 20px;
    text-align: left;
  }
  
  tbody tr {
    border-bottom: 1px solid var(--light-gray);
  }
  
  tbody tr:last-child {
    border-bottom: none;
  }
  
  tbody tr:hover {
    background-color: #f8f9ff;
  }
  
  .badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .badge-primary {
    background: rgba(67, 97, 238, 0.1);
    color: var(--primary);
  }
  
  .badge-warning {
    background: rgba(244, 162, 97, 0.1);
    color: var(--warning);
  }
  
  .action-buttons {
    display: flex;
    gap: 8px;
  }
  
  .btn-sm {
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
  }
  
  .btn-edit {
    background: var(--warning);
    color: white;
  }
  
  .btn-delete {
    background: var(--danger);
    color: white;
  }
  
  .add-link-form, .add-category-form, .add-engine-form {
    background: white;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    padding: 25px;
    margin-top: 30px;
  }
  
  .add-link-form h3, .add-category-form h3, .add-engine-form h3 {
    margin-bottom: 20px;
    font-size: 20px;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--dark);
  }
  
  .form-group input, .form-group select {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
  }
  
  /* 模态框样式 */
  .modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
    align-items: center;
    justify-content: center;
  }
  
  .modal-content {
    background: white;
    padding: 30px;
    border-radius: 12px;
    width: 500px;
    max-width: 90%;
  }
  
  .categories-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  
  .category-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;
  }
  
  .category-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  .category-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .category-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: rgba(67, 97, 238, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    color: var(--primary);
  }
  
  .category-name {
    font-size: 18px;
    font-weight: 600;
  }
  
  .category-actions {
    display: flex;
    gap: 10px;
  }
  
  .settings-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    padding: 30px;
    max-width: 600px;
  }
  
  .settings-form .form-group {
    margin-bottom: 25px;
  }
  
  .settings-form label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--dark);
  }
  
  .settings-form input {
    width: 100%;
    padding: 14px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
  }
  
  .note {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin-top: 30px;
    border-left: 4px solid var(--primary);
  }
  
  .backup-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    padding: 30px;
    max-width: 800px;
  }
  
  .backup-section {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--light-gray);
  }
  
  .backup-section h3 {
    margin-bottom: 15px;
    font-size: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .backup-section p {
    margin-bottom: 15px;
    color: var(--gray);
  }
  
  .backup-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--success);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.3s;
  }
  
  .backup-btn:hover {
    background: #248f82;
    transform: translateY(-2px);
  }
  
  .restore-form {
    margin-top: 20px;
  }
  
  .restore-form input[type="file"] {
    margin-bottom: 15px;
  }
  
  /* 添加侧边栏响应式样式 */
  @media (max-width: 992px) {
    .sidebar {
      transform: translateX(-100%);
      z-index: 1000;
      position: fixed;
      height: 100vh;
    }
    
    .sidebar.sidebar-active {
      transform: translateX(0);
      box-shadow: 5px 0 15px rgba(0, 0, 0, 0.2);
    }
    
    .main-content {
      margin-left: 0;
      width: 100%;
    }
    
    .menu-toggle {
      display: flex !important;
    }
  }
  
  /* 添加菜单按钮样式 */
  .menu-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--primary);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    margin-right: 15px;
    transition: all 0.3s;
  }
  
  .menu-toggle:hover {
    background: var(--dark-primary);
    transform: scale(1.05);
  }
  
  /* 添加遮罩层样式 */
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    display: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .sidebar-overlay.sidebar-active {
    display: block;
    opacity: 1;
  }
  
  /* 侧边栏关闭按钮（移动端） */
  .sidebar-close {
    display: none;
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 24px;
    color: white;
    cursor: pointer;
  }
  
  @media (max-width: 992px) {
    .sidebar-close {
      display: block;
    }
  }
  `;
  
  return new Response(css, {
    headers: { 'Content-Type': 'text/css' }
  });
}

// 显示系统设置页面
async function showSettingsPage() {
  const settings = await getSiteSettings();
  
  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>系统设置 - 导航系统</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/admin/main.css">
  </head>
  <body>
    <!-- 添加遮罩层 -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <!-- 侧边栏 -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-close" id="sidebarClose">
        <i class="fas fa-times"></i>
      </div>
      <div class="sidebar-header">
        <h1><i class="fas fa-compass"></i> 导航系统</h1>
      </div>
      <ul class="nav-links">
        <li><a href="/admin/dashboard"><i class="fas fa-tachometer-alt"></i> 仪表盘</a></li>
        <li><a href="/admin/links"><i class="fas fa-link"></i> 链接管理</a></li>
        <li><a href="/admin/categories"><i class="fas fa-folder"></i> 分类管理</a></li>
        <li><a href="/admin/search-engines"><i class="fas fa-search"></i> 搜索引擎</a></li>
        <li><a href="/admin/settings" class="active"><i class="fas fa-cog"></i> 系统设置</a></li>
        <li><a href="/admin/backup"><i class="fas fa-database"></i> 数据备份</a></li>
      </ul>
    </div>
    
    <!-- 主内容 -->
    <div class="main-content">
      <div class="header">
        <!-- 添加菜单按钮 -->
        <div class="menu-toggle" id="menuToggle">
          <i class="fas fa-bars"></i>
        </div>
        <h2>系统设置</h2>
        <div class="user-menu">
          <div class="user-avatar">A</div>
          <a href="/admin/logout" class="logout-btn"><i class="fas fa-sign-out-alt"></i> 退出</a>
        </div>
      </div>
      
      <div class="content-header">
        <h2><i class="fas fa-cog"></i> 网站设置</h2>
      </div>
      
      <div class="settings-card">
        <form method="POST" action="/admin/settings/update" class="settings-form">
          <div class="form-group">
            <label for="siteTitle">网站标题</label>
            <input type="text" id="siteTitle" name="siteTitle" value="${settings.siteTitle}" required>
          </div>
          
          <div class="form-group">
            <label for="siteDescription">网站描述</label>
            <input type="text" id="siteDescription" name="siteDescription" value="${settings.siteDescription}">
          </div>
          
          <div class="form-group">
            <label for="copyright">版权信息</label>
            <input type="text" id="copyright" name="copyright" value="${settings.copyright}">
          </div>
          
          <div class="form-group">
            <label for="icpNumber">备案号</label>
            <input type="text" id="icpNumber" name="icpNumber" value="${settings.icpNumber}">
          </div>
          
          <h3 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 1px solid #eee;">背景设置</h3>
          
          <div class="form-group">
            <label>背景类型</label>
            <div style="display: flex; gap: 15px; margin-top: 8px;">
              <label>
                <input type="radio" name="backgroundType" value="default" ${settings.backgroundType === 'default' ? 'checked' : ''}>
                默认背景
              </label>
              <label>
                <input type="radio" name="backgroundType" value="bing" ${settings.backgroundType === 'bing' ? 'checked' : ''}>
                Bing每日一图
              </label>
              <label>
                <input type="radio" name="backgroundType" value="custom" ${settings.backgroundType === 'custom' ? 'checked' : ''}>
                自定义背景
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="backgroundImage">自定义背景URL</label>
            <input type="text" id="backgroundImage" name="backgroundImage" value="${settings.backgroundImage}" placeholder="https://example.com/background.jpg">
          </div>
          
          <h3 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 1px solid #eee;">图标设置</h3>
          
          <div class="form-group">
            <label for="faviconUrl">Favicon URL</label>
            <input type="text" id="faviconUrl" name="faviconUrl" value="${settings.faviconUrl}" placeholder="https://example.com/favicon.ico">
          </div>
          
          <h3 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 1px solid #eee;">管理员设置</h3>
          
          <div class="form-group">
            <label for="adminUsername">管理员用户名</label>
            <input type="text" id="adminUsername" name="adminUsername" value="${settings.adminUsername}" required>
          </div>
          
          <div class="form-group">
            <label for="adminPassword">管理员密码</label>
            <input type="password" id="adminPassword" name="adminPassword" placeholder="输入新密码...">
          </div>
          
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> 保存设置
          </button>
        </form>
        
        <div class="note">
          <p><strong>注意：</strong> 修改密码后，请使用新密码登录。</p>
          <p>请确保密码足够安全，建议使用包含大小写字母、数字和特殊字符的组合。</p>
        </div>
      </div>
    </div>
    
    <script>
      // 侧边栏控制逻辑（与仪表盘页面相同）
      const menuToggle = document.getElementById('menuToggle');
      const sidebar = document.getElementById('sidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      const sidebarClose = document.getElementById('sidebarClose');
      
      function toggleSidebar() {
        sidebar.classList.toggle('sidebar-active');
        sidebarOverlay.classList.toggle('sidebar-active');
        
        if (sidebar.classList.contains('sidebar-active')) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
      
      function closeSidebar() {
        sidebar.classList.remove('sidebar-active');
        sidebarOverlay.classList.remove('sidebar-active');
        document.body.style.overflow = '';
      }
      
      menuToggle.addEventListener('click', toggleSidebar);
      sidebarOverlay.addEventListener('click', closeSidebar);
      sidebarClose.addEventListener('click', closeSidebar);
      
      document.addEventListener('click', (event) => {
        if (window.innerWidth > 992) return;
        
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnMenuToggle = menuToggle.contains(event.target);
        
        if (!isClickInsideSidebar && !isClickOnMenuToggle && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
          closeSidebar();
        }
      });
    </script>
  </body>
  </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// 显示备份页面
async function showBackupPage() {
  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数据备份 - 导航系统</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/admin/main.css">
  </head>
  <body>
    <!-- 添加遮罩层 -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <!-- 侧边栏 -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-close" id="sidebarClose">
        <i class="fas fa-times"></i>
      </div>
      <div class="sidebar-header">
        <h1><i class="fas fa-compass"></i> 导航系统</h1>
      </div>
      <ul class="nav-links">
        <li><a href="/admin/dashboard"><i class="fas fa-tachometer-alt"></i> 仪表盘</a></li>
        <li><a href="/admin/links"><i class="fas fa-link"></i> 链接管理</a></li>
        <li><a href="/admin/categories"><i class="fas fa-folder"></i> 分类管理</a></li>
        <li><a href="/admin/search-engines"><i class="fas fa-search"></i> 搜索引擎</a></li>
        <li><a href="/admin/settings"><i class="fas fa-cog"></i> 系统设置</a></li>
        <li><a href="/admin/backup" class="active"><i class="fas fa-database"></i> 数据备份</a></li>
      </ul>
    </div>
    
    <!-- 主内容 -->
    <div class="main-content">
      <div class="header">
        <!-- 添加菜单按钮 -->
        <div class="menu-toggle" id="menuToggle">
          <i class="fas fa-bars"></i>
        </div>
        <h2>数据备份</h2>
        <div class="user-menu">
          <div class="user-avatar">A</div>
          <a href="/admin/logout" class="logout-btn"><i class="fas fa-sign-out-alt"></i> 退出</a>
        </div>
      </div>
      
      <div class="backup-card">
        <div class="backup-section">
          <h3><i class="fas fa-download"></i> 备份数据库</h3>
          <p>点击下方按钮将当前数据库导出为JSON文件。此操作将下载一个包含所有站点数据的备份文件。</p>
          <button class="backup-btn" id="backupBtn">
            <i class="fas fa-database"></i> 导出数据库
          </button>
        </div>
        
        <div class="backup-section">
          <h3><i class="fas fa-upload"></i> 还原数据库</h3>
          <p>选择之前导出的JSON备份文件并上传以恢复数据。此操作将覆盖当前数据库中的所有数据，请谨慎操作！</p>
          <form class="restore-form" method="POST" action="/admin/restore" enctype="multipart/form-data">
            <input type="file" name="backupFile" accept=".json" required>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-upload"></i> 恢复数据库
            </button>
          </form>
        </div>
      </div>
    </div>
    
    <script>
      document.getElementById('backupBtn').addEventListener('click', async function() {
        try {
          // 获取所有数据
          const [settings, links, categories, engines] = await Promise.all([
            fetch('/api/site_settings').then(res => res.json()),
            fetch('/api/links').then(res => res.json()),
            fetch('/api/categories').then(res => res.json()),
            fetch('/api/search_engines').then(res => res.json())
          ]);
          
          // 创建备份数据对象
          const backupData = {
            timestamp: new Date().toISOString(),
            settings,
            links,
            categories,
            engines
          };
          
          // 创建Blob并下载
          const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = 'nav_backup_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (error) {
          alert('备份失败: ' + error.message);
        }
      });
      
      // 侧边栏控制逻辑（与仪表盘页面相同）
      const menuToggle = document.getElementById('menuToggle');
      const sidebar = document.getElementById('sidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      const sidebarClose = document.getElementById('sidebarClose');
      
      function toggleSidebar() {
        sidebar.classList.toggle('sidebar-active');
        sidebarOverlay.classList.toggle('sidebar-active');
        
        if (sidebar.classList.contains('sidebar-active')) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
      
      function closeSidebar() {
        sidebar.classList.remove('sidebar-active');
        sidebarOverlay.classList.remove('sidebar-active');
        document.body.style.overflow = '';
      }
      
      menuToggle.addEventListener('click', toggleSidebar);
      sidebarOverlay.addEventListener('click', closeSidebar);
      sidebarClose.addEventListener('click', closeSidebar);
      
      document.addEventListener('click', (event) => {
        if (window.innerWidth > 992) return;
        
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnMenuToggle = menuToggle.contains(event.target);
        
        if (!isClickInsideSidebar && !isClickOnMenuToggle && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar.classList.contains('sidebar-active')) {
          closeSidebar();
        }
      });
      
      window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
          closeSidebar();
        }
      });
    </script>
  </body>
  </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// 显示还原页面
async function showRestorePage() {
  return Response.redirect('/admin/backup', 302);
}

// 处理数据库备份
async function handleBackup(request) {
  try {
    // 获取所有数据
    const settings = await getSiteSettings();
    const links = await getLinks();
    const categories = await getCategories();
    const engines = await getSearchEngines();
    
    // 创建备份数据对象
    const backupData = {
      timestamp: new Date().toISOString(),
      settings,
      links,
      categories,
      engines
    };
    
    // 返回JSON响应
    return new Response(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="nav_backup.json"'
      }
    });
  } catch (error) {
    return new Response(`备份失败: ${error.message}`, { status: 500 });
  }
}

// 处理数据库还原
async function handleRestore(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('backupFile');
    
    if (!file || typeof file === 'string') {
      return new Response('请选择有效的备份文件', { status: 400 });
    }
    
    // 读取文件内容
    const fileContent = await file.text();
    const backupData = JSON.parse(fileContent);
    
    // 验证备份数据
    if (!backupData.settings || !backupData.links || !backupData.categories || !backupData.engines) {
      return new Response('无效的备份文件格式', { status: 400 });
    }
    
    // 恢复数据到KV
    await Promise.all([
      globalThis.NAV_DB.put('site_settings', JSON.stringify(backupData.settings)),
      globalThis.NAV_DB.put('links', JSON.stringify(backupData.links)),
      globalThis.NAV_DB.put('categories', JSON.stringify(backupData.categories)),
      globalThis.NAV_DB.put('search_engines', JSON.stringify(backupData.engines))
    ]);
    
    // 重定向回备份页面并显示成功消息
    return Response.redirect(new URL('/admin/backup?restore=success', request.url).toString(), 303);
  } catch (error) {
    return new Response(`还原失败: ${error.message}`, { status: 500 });
  }
}

// 显示前台页面
async function showFrontend(request) {
  const settings = await getSiteSettings();
  const categories = await getCategories();
  const links = await getLinks();
  const popularLinks = await getPopularLinks(10);
  const featuredLinks = await getFeaturedLinks(12);
  const engines = await getSearchEngines();
  const isAdminLoggedIn = await verifyAdminSession(request);
  
  // 按分类分组链接
  const linksByCategory = {};
  categories.forEach(category => {
    if (!category.isPrivate || isAdminLoggedIn) {
      linksByCategory[category.name] = links.filter(link => link.category === category.name);
    }
  });
  
  // 过滤私有分类
  const visibleCategories = categories.filter(cat => !cat.isPrivate || isAdminLoggedIn);
  
  // 渲染单个链接项的函数
  const renderLinkItem = (link) => {
    let iconContent;
    if (link.icon.startsWith('http')) {
      iconContent = `<img src="${link.icon}" alt="icon">`;
    } else {
      iconContent = `<i class="fas ${link.icon || 'fa-globe'}"></i>`;
    }
    
    return `
      <a href="${link.url}" target="_blank" class="item" data-id="${link.id}" title="${link.description || link.title}">
        <span class="icon">
          ${iconContent}
        </span>
        <span class="name">${link.title}</span>
      </a>
    `;
  };
  
  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN" data-theme="light">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${settings.siteTitle}</title>
    <meta name="keywords" content="${settings.siteTitle}, 导航, 网站导航">
    <meta name="description" content="${settings.siteDescription}">
    <link rel="shortcut icon" type="images/x-icon" href="/favicon.ico"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      :root {
        --bg-color: #f9f9f9;
        --text-color: #3d3d3d;
        --card-bg: rgba(255, 255, 255, 0.85);
        --card-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
        --border-color: #f2f2f2;
        --hover-bg: #eee;
        --primary-color: #ff7f00;
        --header-bg: rgba(255, 255, 255, 0.3);
        --header-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
        --link-color: #000000;
        --selection-bg: #ff7f00;
        --selection-color: #fff;
        --search-bg: rgba(255, 255, 255, 0.85);
        --search-type-bg: rgba(173, 173, 173, 0.4);
        --search-type-active: rgba(255, 253, 253, 0.85);
        --nav-bg-color: rgb(255, 255, 255, 0.85); 
        --ico-bg-color: rgb(255 255 255 / 0%);
      }
      
      @media (prefers-color-scheme: dark) {
        :root {
          --bg-color: #1a1a1a;
          --text-color: #fff;
          --card-bg: rgba(45,45,45,0.85);
          --card-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
          --border-color: #3d3d3d;
          --hover-bg: #3d3d3d;
          --header-bg: rgba(45, 45, 45, 0.9);
          --header-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
          --link-color: #ddd;
          --search-bg: rgba(45, 45, 45, 0.85);
          --search-type-bg: rgba(85, 85, 85, 0.4);
          --search-type-active: rgba(45, 45, 45, 0.85);
          --nav-bg-color: rgb(57, 56, 56, 0.85);
          --ico-bg-color: rgb(60 60 60 / 0%);
        }
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: "Microsoft YaHei UI", Roboto, Noto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-color);
        background: var(--bg-color);
        transition: background 0.3s, color 0.3s;
      }

      a {
        color: var(--link-color);
        text-decoration: none;
        transition: color 0.3s;
      }

      a:hover {
        color: var(--primary-color);
      }

      a.top-text {
          color: #ff7f00;
      }

      .container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 15px;
      }

      .header {
        position: absolute;
        width: 100%;
        height: 60px;
        top: 0;
        left: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        transition: all 0.3s;
      }

      .logo {
          align-items: center;
          display: inline-flex;
          justify-content: center;
          height: 55px;
          width: 220px;
          padding: 8px 0;
      }

      .logo p {
          color: #ff7f00;
          font-size: x-large;
          display: grid;
          height: 60px;
          align-items: end;
      }

      .nav {
          display: flex;
          margin-left: auto;
          font-size: 14px;
          float: right;
      }

      .nav li {
        margin-left: 20px;
        position: relative;
      }

      .nav li a {
        display: flex;
        align-items: center;
        height: 60px;
        padding: 0 10px;
      }

      .nav li a i {
        margin-right: 5px;
      }

      .nav li::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 3px;
        background: var(--primary-color);
        transition: width 0.3s;
      }

      .nav li:hover::after {
        width: 100%;
      }

      ul, li {
          list-style: none;
      }

      .banner {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 300px;
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center;
      }

      .search-type {
        flex-wrap: wrap;
        justify-content: center;
        display: flex;
        margin-bottom: 15px;
        z-index: 1;
      }
      
      .search-type li {
        color: white;
        background: var(--search-type-bg);
        padding: 8px 15px;
        margin: 0 5px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;
      }

      .search-type li.active,
      .search-type li:hover {
        background: var(--search-type-active);
        color: var(--primary-color);
      }

      .search-main {
        display: flex;
        width: 80%;
        max-width: 700px;
        z-index: 1;
      }

      .search-input {
        flex: 1;
        padding: 12px 15px;
        border: none;
        border-radius: 4px 0 0 4px;
        font-size: 16px;
        background: var(--card-bg);
        color: var(--text-color);
        outline: none;
      }

      .search-btn {
        padding: 0 20px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 0 4px 4px 0;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.3s;
      }

      .search-btn:hover {
        background: #e67300;
      }

      .card {
        background: var(--card-bg);
        border-radius: 8px;
        box-shadow: var(--card-shadow);
        margin: 15px 0;
        overflow: hidden;
      }

      .card-head {
        padding: 12px 15px;
        font-weight: bold;
        display: flex;
        align-items: center;
      }

      .card-head i {
        margin-right: 8px;
        color: var(--primary-color);
      }

      .card-body {
        padding: 10px;
        display: flex;
        flex-wrap: wrap;
      }

      .item {
        width: 16.666%;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        transition: transform 0.3s;
      }

      @media (max-width: 992px) {
        .item {
          width: 20%;
        }
      }

      @media (max-width: 767px) {
        .item {
          width: 25%;
        }
      }

      @media (max-width: 576px) {
        .item {
          width: 33.333%;
        }
      }

      .item:hover {
        transform: translateY(-5px);
      }

      .icon {
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        background-color: var(--ico-bg-color);
        border-radius: 9px;
      }

      .icon img {
		border-radius: 9px;
        max-width: 100%;
        max-height: 100%;
    }
      .icon i {
        font-size: 24px;
        color: var(--primary-color);
      }

      .name {
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        margin-top: 8px;
      }

      .clicks {
        color: var(--primary-color);
        font-size: 12px;
        margin-top: 3px;
      }

      .private-tag {
        color: #ff5252;
        font-size: 10px;
        margin-top: 2px;
      }

      .login-notice {
        width: 100%;
        text-align: center;
        padding: 10px;
        background: var(--hover-bg);
        border-radius: 4px;
        margin-top: 10px;
      }

      .login-notice a {
        color: var(--primary-color);
        font-weight: bold;
      }

      .top-grid {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
      }

      .top-grid .item {
        width: 14.285%;
      }

      @media (max-width: 992px) {
        .top-grid .item {
          width: 20%;
        }
      }

      @media (max-width: 767px) {
        .top-grid .item {
          width: 25%;
        }
      }

      .sub-category {
        width: 100%;
        padding: 8px;
        font-weight: bold;
        color: var(--primary-color);
        border-bottom: 1px dashed var(--border-color);
        margin-bottom: 8px;
      }

      .suspend {
        position: fixed;
        right: 20px;
        bottom: 20px;
        list-style: none;
      }

      .suspend li {
        width: 40px;
        height: 40px;
        background: var(--primary-color);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 10px 0;
        cursor: pointer;
        position: relative;
        transition: all 0.3s;
      }

      .suspend li:hover {
        transform: scale(1.1);
      }

      .suspend li .more {
        position: absolute;
        right: 50px;
        color: var(--text-color);
        background: var(--card-bg);
        padding: 5px 10px;
        border-radius: 4px;
        box-shadow: var(--card-shadow);
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s;
      }

      .suspend li:hover .more {
        opacity: 1;
        right: 60px;
        pointer-events: auto;
      }

      .back-top {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s;
      }

      .back-top.show {
        opacity: 1;
        transform: translateY(0);
      }

      .footer {
        text-align: center;
        padding: 20px 0;
        margin-top: 30px;
        border-top: 1px solid var(--border-color);
      }

      p {
          margin: 5px 0;
      }

      .theme-switcher {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 40px;
        height: 40px;
        background: var(--card-bg);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--card-shadow);
        cursor: pointer;
        z-index: 100;
      }
      
      /* 版本信息样式 */
      .version-info {
       // margin-top: 15px;
       // padding: 10px;
        background: rgba(255, 255, 255, 0);
        border-radius: 8px;
        font-size: 13px;
        text-align: center;
      }
      
      .version-update {
        color: #ff9800;
        font-weight: bold;
        margin-top: 5px;
        animation: pulse 2s infinite;
      }
      
      .version-error {
        color: #f44336;
        font-size: 12px;
        margin-top: 5px;
      }
      
      @keyframes pulse {
        0% { opacity: 0.8; }
        50% { opacity: 1; }
        100% { opacity: 0.8; }
      }

      /* 背景图片 */
      .banner-video {
          position: absolute;
          width: 100%;
          overflow: hidden;
          left: 0;
          top: 0;
          height: 100vh;
          z-index: -1;

      }

      .banner-video img {
          object-fit: cover;
          width: 100%;
          height: 100vh;
      }

      .bottom-cover {
          width: 100%;
          height: 50%;
          position: absolute;
          bottom: -1px;
          z-index: 10;
          background-image: linear-gradient(rgba(255, 255, 255, 0) 0%, var(--bg-color) 80%, var(--bg-color) 90%);
      }
      
      /* 响应式调整 */
      @media (max-width: 767px) {
        .nav {
          flex-direction: column;
          position: fixed;
          top: 52px;
          right: 0;
          float: none;
          margin-left: 0;
          opacity: 0;
          visibility: hidden;
          text-align: right;
          z-index: 999;
          transition: all .3s ease-in-out;
        }

        .nav.active {
          opacity: 1;
          visibility: visible;
        }
      }
      
      .nav-bar {
          position: absolute;
          top: 0;
          right: 0;
          width: 50px;
          height: 50px;
          z-index: 1000;
          cursor: pointer;
          transform: scale(0.8);
          transition: transform .3s;
      }

      .nav-bar.active {
          transform: rotateZ(90deg) scale(0.8);
      }

      .nav-bar span {
          position: absolute;
          left: 0;
          right: 0;
          margin: 24px auto;
          width: 25px;
          height: 2px;
          background: #aaa;
          border-radius: 25px;
      }

      .nav-bar span::before {
          content: '';
          position: absolute;
          top: -8px;
          right: 0;
          width: 16px;
          height: 2px;
          background: #aaa;
          border-radius: 25px;
      }

      .nav-bar span::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -8px;
          width: 16px;
          height: 2px;
          background: #aaa;
          border-radius: 25px;
      }
      
      @media (max-width: 480px) {
        .search-type, .search-main {
            width: 95%;
        }
      }
	  
      @media (min-width: 767px) {
        .nav-bar {
            display: none;
        }
      }
    </style>
  </head>
  <body>
    <header class="header">
      <div class="container">
        <span class="nav-bar">
          <span></span>
        </span>
        <a class="logo" href="/">
          <p class="logo">${settings.siteTitle}</p>
        </a>
        <ul class="nav">
          <li><a href="/" class="top-text"><i class="fas fa-home"></i> <span>导航首页</span></a></li>
          ${isAdminLoggedIn ? `
            <li><a href="/admin/dashboard" class="top-text"><i class="fas fa-cog"></i> <span>管理后台</span></a></li>
            <li><a href="/admin/logout" class="top-text"><i class="fas fa-sign-out-alt"></i> <span>退出</span></a></li>
          ` : `
            <li><a href="/admin/login" class="top-text"><i class="fas fa-sign-in-alt"></i> <span>登录管理</span></a></li>
          `}
        </ul>
      </div>
    </header>
    
    <div class="banner-video">
      <img id="background-image" src="/background-image" alt="背景图片">
      <div class="bottom-cover"></div>
    </div>
    
    <div class="banner">
    <ul class="search-type">
        ${engines.map((engine, index) => `
            <li data-type="${index}" ${index === 0 ? 'class="active"' : ''}>${engine.name}</li>
        `).join('')}
    </ul>
    <form class="search-main" id="searchForm" onsubmit="return false;">
        <input type="hidden" name="engine" id="selectedEngine" value="${engines[0].urlTemplate}">
        <input class="search-input" id="search-input" placeholder="请输入关键词..." name="q" required>
        <button type="button" class="search-btn">${engines[0].name}</button>
    </form>
</div>
    
    <div class="container">
      <div class="main">
        ${featuredLinks.length > 0 ? `
        <div class="card">
          <div class="card-head">
            <i class="fa fa-heart"></i> 推荐站点
          </div>
          <div class="top-grid">
            ${featuredLinks.map(link => renderLinkItem(link)).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="card">
          <div class="card-head">
            <i class="fas fa-chart-line"></i> 点击榜单
          </div>
          <div class="card-body">
            ${popularLinks.map((link, index) => `
              <a href="${link.url}" target="_blank" class="item" title="${link.title}" data-id="${link.id}">
                <span class="icon">
                  ${link.icon.startsWith('http') ? 
                    `<img src="${link.icon}" alt="icon">` : 
                    `<i class="fas ${link.icon || 'fa-globe'}"></i>`}
                </span>
                <span class="name">${link.title}</span>
                <span class="clicks">🔥${link.clicks || 0}</span>
                ${link.isPrivate ? '<span class="private-tag">(私有)</span>' : ''}
              </a>
            `).join('')}
          </div>
        </div>
        
        ${visibleCategories.map(category => `
          <div class="card">
            <div class="card-head">
              <i class="fas ${category.icon}"></i> ${category.name}
              ${category.isPrivate ? '<span class="private-tag">(私有)</span>' : ''}
            </div>
            <div class="card-body">
              ${(linksByCategory[category.name] || []).slice(0, 12).map(link => `
                <a href="${link.url}" target="_blank" class="item" title="${link.title}" data-id="${link.id}">
                  <span class="icon">
                    ${link.icon.startsWith('http') ? 
                      `<img src="${link.icon}" alt="icon">` : 
                      `<i class="fas ${link.icon || 'fa-globe'}"></i>`}
                  </span>
                  <span class="name">${link.title}</span>
                </a>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <ul class="suspend">
      <li class="back-top" onclick="backTop()">
        <i class="fas fa-chevron-up"></i>
        <span class="more">返回顶部</span>
      </li>
    </ul>
    
    <footer class="footer">
      <p>${settings.copyright}</p>
      <p>${settings.icpNumber}</p> 
       
      <!-- 版本信息区域 -->
      <div class="version-info" id="versionInfo">
        <p>程序已开源：<a href="https://github.com/Shaw-fung/navsite">Shaw-fung/navsite</a>.当前版本: <span id="currentVersion">v1.0.0</span></p>
        <div id="updateMessage"></div>
      </div>
    </footer>
    
    <div class="theme-switcher" id="themeToggle">
      <i class="fas fa-moon"></i>
    </div>
    
    <script>
      // 返回顶部按钮
      window.addEventListener('scroll', function() {
        const backTop = document.querySelector('.back-top');
        if (window.scrollY > 300) {
          backTop.classList.add('show');
        } else {
          backTop.classList.remove('show');
        }
      });
      
      function backTop() {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      
      // 主题切换
      const themeToggle = document.getElementById('themeToggle');
      const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
      
      // 初始化主题
      let currentTheme = localStorage.getItem('theme') || 'system';
      updateTheme(currentTheme);
      
      themeToggle.addEventListener('click', () => {
        // 循环切换主题：system -> light -> dark -> system
        if (currentTheme === 'system') {
          currentTheme = 'light';
        } else if (currentTheme === 'light') {
          currentTheme = 'dark';
        } else {
          currentTheme = 'system';
        }
        localStorage.setItem('theme', currentTheme);
        updateTheme(currentTheme);
      });
      
      function updateTheme(theme) {
        let themeValue;
        if (theme === 'system') {
          themeValue = prefersDarkScheme.matches ? 'dark' : 'light';
          document.documentElement.removeAttribute('data-theme');
        } else {
          themeValue = theme;
          document.documentElement.setAttribute('data-theme', themeValue);
        }
        
        // 更新按钮图标
        if (theme === 'system') {
          themeToggle.innerHTML = '<i class="fas fa-adjust"></i>';
        } else if (theme === 'light') {
          themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
          themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
      }
      
      // 搜索类型切换
      document.querySelectorAll('.search-type li').forEach(item => {
          item.addEventListener('click', function() {
              document.querySelectorAll('.search-type li').forEach(i => i.classList.remove('active'));
              this.classList.add('active');
              const engineIndex = this.getAttribute('data-type');
              const engines = ${JSON.stringify(engines)};
              document.getElementById('selectedEngine').value = engines[engineIndex].urlTemplate;
              document.querySelector('.search-btn').textContent = engines[engineIndex].name;
          });
      });
  
      // 搜索按钮点击事件
      document.querySelector('.search-btn').addEventListener('click', function() {
          performSearch();
      });
  
      // 捕捉 Enter 键事件
      document.getElementById('search-input').addEventListener('keypress', function(event) {
          if (event.key === 'Enter') {
              event.preventDefault(); // 防止表单提交
              performSearch();
          }
      });
  
      // 执行搜索的函数
      function performSearch() {
          const keyword = document.querySelector('#search-input').value; // 获取用户输入的关键字
          const selectedEngineUrl = document.getElementById('selectedEngine').value;
          
          // 替换 {query} 为用户输入的关键字
          const finalUrl = selectedEngineUrl.replace('{query}', encodeURIComponent(keyword));
          
          // 在新窗口中打开 URL
          window.open(finalUrl, '_blank');
      }
      
      // 移动端菜单切换
      document.querySelector('.nav-bar').addEventListener('click', function() {
        this.classList.toggle('active');
        document.querySelector('.nav').classList.toggle('active');
      });
      
      // 站点点击统计
      document.querySelectorAll('.item').forEach(item => {
        item.addEventListener('click', function() {
          const siteId = this.getAttribute('data-id');
          if (siteId) {
            fetch('/api/click', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ id: siteId })
            });
          }
        });
      });
      
      // 版本检查功能
      const VERSION_CHECK_KEY = 'versionCheck';
      const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6小时检查一次
      const CURRENT_VERSION = 'v1.0.0'; // 当前版本
      
      // 设置当前版本显示
      document.getElementById('currentVersion').textContent = CURRENT_VERSION;
      
      // 检查新版本
      async function checkForUpdates() {
        try {
          const lastCheck = localStorage.getItem(VERSION_CHECK_KEY);
          const now = Date.now();
          
          // 检查频率限制
          if (lastCheck && (now - parseInt(lastCheck)) < CHECK_INTERVAL) {
            console.log('跳过版本检查（频率限制）');
            return;
          }
          
          // 存储最后检查时间
          localStorage.setItem(VERSION_CHECK_KEY, now.toString());
          
          // 尝试GitHub API
          let response = await fetch('https://api.github.com/repos/Shaw-fung/navsite/releases/latest', {
            headers: {
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          // 处理GitHub速率限制
          if (response.status === 403) {
            throw new Error('GitHub API rate limit exceeded');
          }
          
          // 如果GitHub失败，尝试备用源
          if (!response.ok) {
            throw new Error('GitHub API failed');
          }
          
          const data = await response.json();
          const latestVersion = data.tag_name;
          
          // 比较版本
          if (isNewerVersion(latestVersion, CURRENT_VERSION)) {
            showUpdateMessage(\`有新版本可用: \${latestVersion}\`, true);
          } else {
            showUpdateMessage('已是最新版本', false);
          }
        } catch (error) {
          console.error('版本检查失败:', error);
          
          // 尝试备用源
          try {
            const backupResponse = await fetch('https://duibi.top/navsite/version');
            if (backupResponse.ok) {
              const backupData = await backupResponse.json();
              if (isNewerVersion(backupData.version, CURRENT_VERSION)) {
                showUpdateMessage(\`有新版本可用: \${backupData.version} (备用源)\`, true);
              } else {
                showUpdateMessage('已是最新版本 (备用源)', false);
              }
            } else {
              showUpdateMessage('新版本检查失败', false, true);
            }
          } catch (backupError) {
            console.error('备用源检查失败:', backupError);
            showUpdateMessage('新版本检查失败', false, true);
          }
        }
      }
      
      // 版本比较函数 (简单实现)
      function isNewerVersion(newVersion, currentVersion) {
        // 简单比较：去除v字符后按字典序比较
        const cleanNew = newVersion.replace(/^v/, '');
        const cleanCurrent = currentVersion.replace(/^v/, '');
        return cleanNew > cleanCurrent;
      }
      
      // 显示更新消息
      function showUpdateMessage(message, isUpdate = false, isError = false) {
        const updateMessage = document.getElementById('updateMessage');
        updateMessage.innerHTML = '';
        
        const messageElement = document.createElement('div');
        if (isUpdate) {
          messageElement.className = 'version-update';
          messageElement.innerHTML = \`
            \${message} 
            <a href="https://github.com/Shaw-fung/navsite/releases" target="_blank" style="color:#ff9800;margin-left:5px;">
              <i class="fas fa-external-link-alt"></i> 查看更新
            </a>
          \`;
        } else if (isError) {
          messageElement.className = 'version-error';
          messageElement.textContent = message;
        } else {
          messageElement.textContent = message;
          messageElement.style.color = '#4CAF50';
        }
        
        updateMessage.appendChild(messageElement);
      }
      
      // 页面加载后检查更新
      setTimeout(checkForUpdates, 2000);
    </script>
  </body>
  </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}