import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  ShoppingCart,
  Package,
  Settings,
  Bell,
  Store,
  Image,
  FileText,
  Shield,
  AlignLeft,
  LayoutDashboard,
  UserRound,
  CreditCard ,
  Palette,
  Sliders,
  BadgeCheck,
  Cog,
  Upload,
  RefreshCw,
  Warehouse,
  FileX ,
  Bot,
} from 'lucide-react';
import { permissionIdsInclude } from '../utils/permissionUtils';
import {
  getMenuPermissionCodeForHref,
  isHrefAllowedBySubscriptionPlan,
  isTenantAdminRole,
  normalizePlanFeatureTokens,
  PLAN_FEATURE_TOKEN_BY_HREF,
} from '../utils/planAccessUtils';
import { APP_ROUTES, WINDOW_CUSTOM_EVENTS } from '../contants/constants';
import { hasAnyProductSetupViewPermission } from '../utils/productSetupPermissionUtils';

const Sidebar = ({ onClose, isCollapsed, onToggle, isMobileOpen, onMobileClose }) => {
  const location = useLocation();
  const [nExpandedSection, setExpandedSection] = useState(null);
  const [nHoveredSection, setHoveredSection] = useState(null);
  const [subscriptionMenuTick, setSubscriptionMenuTick] = useState(0);
  const { t } = useTranslation();

  const aNavigation = useMemo(() => [
    {
      name: t('SIDEBAR.DASHBOARD'),
      href: '/dashboard',
      icon: LayoutDashboard,
      section: 'Dashbord',
    },
    {
      name: t('SIDEBAR.AI_CHAT') || 'AI Chat Board',
      href: '/chat',
      icon: Bot,
      relatedPaths: ['/ai-assistant']
    },
    {
      name: t('SIDEBAR.ORDERS'),
      href: '/orders',
      icon: ShoppingCart
    },
    {
      name: t('SIDEBAR.PRODUCT_MANAGEMENT'),
      href: '#',
      icon: Package,
      section: 'Product Management',
      subItems: [
        { name: t('SIDEBAR.PRODUCT_SETUP'), href: APP_ROUTES.BROWSE, icon: Settings },
        { name: t('SIDEBAR.PRODUCTS'), href: '/productList', icon: Package, relatedPaths: ['/Addproduct','/edit-product','/AddVariants','/productdetails'] },
        { name: t('SIDEBAR.PRODUCT_INVENTORY'), href:'/InventoryList', icon:Warehouse},
        { name: t('SIDEBAR.LOW_STOCK'), href: APP_ROUTES.LOW_STOCK, icon: RefreshCw },
      ]
    },
    {
      name: t('SIDEBAR.STORES'),
      href: '/stores',
      icon: Store,
      relatedPaths: ['/add-store', '/editStore']
    },
    {
      name: t('SIDEBAR.USER_MANAGEMENT'),
      href: '#',
      icon: Users,
      section: 'User Management',
      subItems: [
        { name: t('SIDEBAR.USERS'), href: '/users', icon: Users,  relatedPaths: ['/add-user','/editUser'] },
        { name: t('SIDEBAR.ROLES'), href: '/userRoles', icon: Shield, relatedPaths: ['/addUserRole','/edit-UserRole'] },
      ]
    },
    {
      name: t('SIDEBAR.CONTENT_MANAGEMENT'),
      href: '#',
      icon: FileText,
      section: 'Content Management',
      subItems: [
        { name: t('SIDEBAR.BANNERS'), href: '/banners', icon: Image, relatedPaths: ['/banners-create','/activeBanners'] },
        { name: t('SIDEBAR.NOTIFICATIONS'), href: '/notifications', icon: Bell },
      ]
    },
    {
      name: t('SIDEBAR.DATA_IMPORT'),
      href: '#',
      icon: Upload,
      section: 'Data Import',
      subItems: [
        { name: t('SIDEBAR.BULK_IMPORT'), href: '/bulk-import', icon: Upload },
        { name: t('SIDEBAR.BULK_IMAGES'), href: '/bulk-images', icon: Image },
      ]
    },
    // Add Payments menu item
    {
      name: t('SIDEBAR.PAYMENTS'),
      href: '/payments',
      icon: CreditCard,
      relatedPaths: ['/payment-details']
    },
    {
      name: t('SIDEBAR.CANCELLATIONS'),
      href: APP_ROUTES.CANCELLATIONS,
      icon: FileX,
      relatedPaths: ['/cancellation-details']
    },
      
    {
      name: t('SIDEBAR.TENANT_SETTINGS'),
      href: '#',
      icon: Settings,
      section: 'Settings',
      subItems: [
        { name: t('SIDEBAR.THEMES'), href: '/theme-settings', icon: Cog },
        {name: t('SIDEBAR.SUBSCRIPTION'),href: '/subscription',icon: BadgeCheck,relatedPaths: ['/subscription']},
      ]
    },
  ], [t]);
 
  const userPermissionIDs = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('PermissionIDs')) || [];
    } catch {
      return [];
    }
  }, [location.pathname, subscriptionMenuTick]);

  const allPermissions = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('AllPermissions')) || [];
    } catch {
      return [];
    }
  }, [location.pathname, subscriptionMenuTick]);
 
const allowedPermissionCodes = useMemo(() => {
  // Match PermissionID instead of ID/Code (normalize string/UUID vs number)
  return allPermissions
    .filter((perm) =>
      permissionIdsInclude(userPermissionIDs, perm.PermissionID)
    )
    .map((perm) => perm.PermissionID);
}, [allPermissions, userPermissionIDs]);
 
 
  useEffect(() => {
    const bump = () => setSubscriptionMenuTick((n) => n + 1);
    window.addEventListener(
      WINDOW_CUSTOM_EVENTS.SUBSCRIPTION_STORAGE_CHANGED,
      bump
    );
    window.addEventListener(
      WINDOW_CUSTOM_EVENTS.SUBSCRIPTION_READ_ONLY_CHANGED,
      bump
    );
    window.addEventListener(
      WINDOW_CUSTOM_EVENTS.PERMISSIONS_STORAGE_CHANGED,
      bump
    );
    const onStorage = (e) => {
      if (
        e.key === "PermissionIDs" ||
        e.key === "AllPermissions" ||
        e.key === "sessionRoleName"
      ) {
        bump();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(
        WINDOW_CUSTOM_EVENTS.SUBSCRIPTION_STORAGE_CHANGED,
        bump
      );
      window.removeEventListener(
        WINDOW_CUSTOM_EVENTS.SUBSCRIPTION_READ_ONLY_CHANGED,
        bump
      );
      window.removeEventListener(
        WINDOW_CUSTOM_EVENTS.PERMISSIONS_STORAGE_CHANGED,
        bump
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const filteredNavigation = useMemo(() => {
    let planFeatures = [];
    let hasFeatureGating = false;
    try {
      const sub = JSON.parse(localStorage.getItem("subscription"));
      planFeatures = normalizePlanFeatureTokens(sub?.features || []);
      hasFeatureGating = Boolean(sub?.hasFeatureGating);
    } catch {
      planFeatures = [];
    }

    const isAdmin = isTenantAdminRole();

    // Plan-allowed check that respects hasFeatureGating (no empty-array bypass)
    const isPlanAllowed = (href) => {
      if (href === APP_ROUTES.SUBSCRIPTION) return true; // gated separately
      const token = PLAN_FEATURE_TOKEN_BY_HREF[href];
      if (!token) return true; // no plan token → unrestricted
      if (hasFeatureGating) {
        const want = token.toLowerCase().trim();
        return planFeatures.some((f) => String(f).toLowerCase().trim() === want);
      }
      return isHrefAllowedBySubscriptionPlan(href, planFeatures, false);
    };

    const isAllowed = (href) => {
      // Subscription page: admin only
      if (href === APP_ROUTES.SUBSCRIPTION) {
        return isAdmin;
      }

      // Product Setup: hide when no view permission is assigned (all roles)
      if (href === APP_ROUTES.BROWSE && !hasAnyProductSetupViewPermission()) {
        return false;
      }

      // Admin: show ALL modules in sidebar (clicking plan-restricted ones shows PlanGate via ProtectedRoute)
      // Non-admin: hide modules not in plan — they can't upgrade
      if (!isAdmin && !isPlanAllowed(href)) {
        return false;
      }

      // Admin bypasses permission checks
      if (isAdmin) {
        return true;
      }

      // Non-admin: also check role-based permissions
      const code = getMenuPermissionCodeForHref(href);
      if (!code) return true;
      return permissionIdsInclude(allowedPermissionCodes, code);
    };
   
    return aNavigation
      .map(item => {
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter(sub => isAllowed(sub.href));
          if (filteredSubItems.length > 0) {
            return { ...item, subItems: filteredSubItems };
          }
          return null;
        } else {
          return isAllowed(item.href) ? item : null;
        }
      })
      .filter(Boolean);
  }, [aNavigation, allowedPermissionCodes, location.pathname, subscriptionMenuTick]);
 
  useEffect(() => {
    const activeSection = filteredNavigation.find(item =>
      item.subItems?.some(subItem =>
        location.pathname.startsWith(subItem.href) || subItem.relatedPaths?.some(p => location.pathname.startsWith(p))
      )
    );
    if (activeSection) {
      setExpandedSection(activeSection.name);
    }
  }, [location.pathname, filteredNavigation]);
 
  const toggleSection = (section) => {
    setExpandedSection(nExpandedSection === section ? null : section);
  };

  // Handle navigation click - close mobile sidebar
  const handleNavClick = () => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  };

  const renderNavigationItem = (item) => {
    const checkIsActive = (navItem) => {
      if (!navItem.href || navItem.href === '#') return false;
      const isActivePath = location.pathname.startsWith(navItem.href);
      const isRelatedActive = navItem.relatedPaths?.some(p => location.pathname.startsWith(p));
      const result = isActivePath || isRelatedActive;
      return result;
    }
 
    const isActive = checkIsActive(item);
    const Icon = item.icon;
    const isHovered = nHoveredSection === item.name;
    const isSectionActive = item.subItems?.some(subItem => checkIsActive(subItem));
    const isExpanded = nExpandedSection === item.name && !isCollapsed;
 
    if (item.subItems) {
      return (
        <div
          key={item.name}
          className="relative transition"
          onMouseEnter={() => setHoveredSection(item.name)}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <input
            className="peer hidden"
            type="checkbox"
            id={`menu-${item.name}`}
            checked={nExpandedSection === item.name}
            onChange={() => toggleSection(item.name)}
          />
          {isExpanded && (
            <div className={`absolute top-[40px] bottom-2 left-5 w-px  ${isSectionActive ? 'bg-custom-bg' : 'bg-gray-400'} vertical-connector-line`}></div>
          )}
          <button
            className={`flex peer relative w-full items-center py-2.5 px-3 text-xs font-semibold leading-none outline-none transition-all duration-100 ease-in-out focus:outline-none border-0 m-0 appearance-none ${isSectionActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-custom-bg dark:hover:text-custom-bg'} ${isSectionActive ? 'border-l-2 border-custom-bg bg-gray-50 dark:bg-gray-900' : ''}`}
          >
            <span className={`h-full flex items-center justify-center ${isSectionActive ? 'text-custom-bg' : ''} mr-3 w-4`}>
              <Icon className="h-4 w-4 align-middle" />
            </span>
            {!isCollapsed && item.name}
            <label htmlFor={`menu-${item.name}`} className="absolute inset-0 h-full w-full cursor-pointer"></label>
          </button>
 
          {isCollapsed && (
            <div className={`absolute left-full top-0 ml-1 w-48 rounded-lg bg-white dark:bg-gray-900 shadow-lg transition-all duration-200 ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
              <div className="py-2">
                {item.subItems.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = checkIsActive(subItem);
                  return (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      onClick={handleNavClick}
                      className={`flex items-center px-4 py-2 text-xs font-medium ${isSubActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-custom-bg dark:hover:text-custom-bg'}`}
                    >
                      <SubIcon className="mr-2.5 h-3.5 w-3.5" />
                      {subItem.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
 
          {!isCollapsed && (
            <ul className="duration-400 flex max-h-0 flex-col overflow-hidden rounded-md bg-gray-50 dark:bg-gray-900 font-medium transition-all duration-300 peer-checked:max-h-96">
              {item.subItems.map((subItem) => {
                const SubIcon = subItem.icon;
                const isSubActive = checkIsActive(subItem);
                const showArrow = isSectionActive;
 
                const arrowBaseClass = 'absolute top-1/2 left-5 w-3 h-px transform -translate-y-1/2';
                const arrowActiveClass = 'bg-custom-bg after:content-[\'\'] after:absolute after:left-full after:top-1/2 after:transform after:-translate-y-1/2 after:-ml-px after:border-t-[3px] after:border-t-transparent after:border-b-[3px] after:border-b-transparent after:border-l-[3px] after:border-l-custom-bg';
                const arrowInactiveClass = 'bg-gray-400 dark:bg-gray-600 after:content-[\'\'] after:absolute after:left-full after:top-1/2 after:transform after:-translate-y-1/2 after:-ml-px after:border-t-[3px] after:border-t-transparent after:border-b-[3px] after:border-b-transparent after:border-l-[3px] after:border-l-gray-400 dark:after:border-l-gray-600';
 
                return (
                  <li key={subItem.name} className="relative">
                    <div
                      className={`${arrowBaseClass} ${isSubActive ? arrowActiveClass : arrowInactiveClass
                        }`}
                    ></div>
 
                    <Link
                      to={subItem.href}
                      onClick={handleNavClick}
                      className={`flex m-1.5 cursor-pointer py-1.5 pl-8 text-xs font-medium transition-all duration-100 ease-in-out ${isSubActive
                          ? 'text-custom-bg font-semibold'
                          : 'text-gray-600 dark:text-gray-300 hover:text-custom-bg dark:hover:text-custom-bg'
                        }`}
                    >
                      <span className="mr-3">
                        <SubIcon className="h-3.5 w-3.5" />
                      </span>
                      {subItem.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      );
    }
 
    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={handleNavClick}
        className={`flex cursor-pointer items-center w-full py-2.5 px-3 text-xs font-semibold leading-none outline-none transition-all duration-100 ease-in-out focus:outline-none border-0 m-0 ${isActive ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900' : 'text-gray-600 dark:text-gray-300 hover:text-custom-bg dark:hover:text-custom-bg'} ${isActive ? 'border-l-2 border-custom-bg' : ''}`}
      >
        <span className={`h-full flex items-center justify-center mr-3 w-4 ${isActive ? 'text-custom-bg' : ''}`}>
          <Icon className="h-4 w-4 align-middle" />
        </span>
        {!isCollapsed && item.name}
        {!isCollapsed && item.badge && (
          <span className="ml-auto rounded-full bg-custom-bg px-1.5 py-0.5 text-xs text-white font-semibold">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };
 
  return (
    <div className={`h-screen bg-gray-100 dark:bg-gray-900 ${isMobileOpen ? 'block' : 'hidden lg:block'}`}>
      <div className={`h-full transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-56'}`}>
        <div className="flex h-full flex-col bg-white dark:bg-black shadow-md">
          <div className="bg-white dark:bg-black">
            <div className="hidden md:flex items-center justify-end px-3 py-2.5">
              <button
                onClick={onToggle}
                className="rounded-md p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-custom-bg dark:hover:text-custom-bg"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1">
            <nav className="h-full">
              {filteredNavigation.map((item) => renderNavigationItem(item))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default Sidebar;
 