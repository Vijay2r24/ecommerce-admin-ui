 import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { TitleProvider } from "./context/TitleContext";
import { AllDataProvider } from "./context/AllDataContext";
import { ThemeProvider } from "./context/ThemeContext";
import LocationDataProvider from "./context/LocationDataProvider";
import ProtectedRoute from './components/ProtectedRoute';
import NotAuthorized from './pages/NotAuthorized';
import { getPermissionCode } from './utils/permissionUtils';
import { Provider } from "react-redux";
import { store } from "./store/index";
import { MODULES, PERMISSIONS, WINDOW_CUSTOM_EVENTS } from './contants/constants';
import { logout } from "./store/slices/authSlice";
import { fetchUserDetails } from "./store/slices/allDataSlice";
import { showEmsg } from "./utils/ShowEmsg";
import i18n from "./i18n.js";
import {
  getFirstAccessibleHrefForSession,
  isPlanExpiredFromSubscriptionStorage,
  isTenantAdminRole,
} from "./utils/planAccessUtils";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import InactivityNotification from './components/InactivityNotification';
import InactivityManager from './components/InactivityManager';
import IdleLogout from './components/IdleLogout';

// Remove all title attributes to prevent white tooltips
const removeTitleAttributes = () => {
  const elementsWithTitle = document.querySelectorAll('[title]');
  elementsWithTitle.forEach(element => {
    const title = element.getAttribute('title');
    if (title) {
      // Store title in data attribute for potential future use
      element.setAttribute('data-original-title', title);
      // Remove the title attribute to prevent browser tooltip
      element.removeAttribute('title');
    }
  });
};

// Direct imports instead of lazy loading
import Layout from "./layout/Layout";
import Browse from "./pages/browse/Browse";
import Dashboard from "./pages/dashboard/Dashboard";
import Users from "./pages/Users";
import Orders from "./pages/orders/OrderList";
import AddUser from "./pages/AddUser";
import ProductList from "./pages/products/ProductList";
import InventoryList from "./pages/products/ProductInventory";
import Addproduct from "./pages/products/AddProductForm";
import AddVariants from "./pages/products/AddVariant";
import ProfileDetails from "./pages/ProfileDetails";
import Stores from "./pages/Stores";
import AddStore from "./pages/AddStore";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import AddUserRole from "./pages/AddUserRole";
import Banners from "./pages/Banners";
import Bannerscreate from "./pages/BannersCreate";
import UserRoles from "../src/pages/UserRolesList";
import OrderDetailPage from "./pages/orders/OrderView";
import CreateBrand from "./pages/browse/brands/CreateBrand";
import CreateCategory from "./pages/browse/categories/CreateCategory";
import BulkImport from "./pages/BulkImport";
import BulkImages from "./pages/BulkImages";
import CreateAttributeType from "./pages/browse/attributeTypes/CreateAttributeType";
import CreateColor from "./pages/browse/colors/CreateColor";
import CreateAttribute from "./pages/browse/AttributeTypeValues/CreateAttributeTypeValuesList";
import CreateProductGroup from "./pages/browse/productGroups/CreateProductGroup";
import ActiveBanners from "./pages/ActiveBannersWithSequence";
import ProductDetails from "./pages/products/ProductDetails";
import Payments from './pages/payments/Payments';
import PaymentDetailsWrapper from './pages/payments/PaymentDetails';
import NotFound from "./components/NotFound";
import ScrollToTop from './components/ScrollToTop';
import ThemeSettings from './pages/ApplicationSettings';
import ApplicationSettings from './pages/ApplicationSettings';
import SubscriptionPlan from './pages/subscription';
import PlanGate from './pages/PlanGate';
import Cancellations from './pages/Cancellation.jsx';
import CreateReason from './pages/CreateReason.jsx';
import LowStock from './pages/products/LoweStock.jsx';
import AiChatBoard from './pages/chat/AiChatBoard.jsx';

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (token) {
    const target = getFirstAccessibleHrefForSession() || "/not-authorized";
    return <Navigate to={target} replace />;
  }
  return children;
};
const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const planExpiredHandlingRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    const handleNavigateUpgradePlan = () => {
      if (!isTenantAdminRole()) {
        const h = getFirstAccessibleHrefForSession();
        navigate(h || "/not-authorized", { replace: true });
        return;
      }
      navigate("/upgrade-plan", { replace: true });
    };
    window.addEventListener(
      WINDOW_CUSTOM_EVENTS.NAVIGATE_UPGRADE_PLAN,
      handleNavigateUpgradePlan
    );
    return () => {
      window.removeEventListener(
        WINDOW_CUSTOM_EVENTS.NAVIGATE_UPGRADE_PLAN,
        handleNavigateUpgradePlan
      );
    };
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === "/") {
      planExpiredHandlingRef.current = false;
    }
  }, [location.pathname]);

  useEffect(() => {
    const handlePlanExpiredLogout = () => {
      if (planExpiredHandlingRef.current) {
        return;
      }
      planExpiredHandlingRef.current = true;
      store.dispatch(logout());
      showEmsg(i18n.t("LOGIN.PLAN_EXPIRED_SESSION"), "error", 6000);
      navigate("/", { replace: true });
    };
    window.addEventListener(
      WINDOW_CUSTOM_EVENTS.PLAN_EXPIRED_LOGOUT,
      handlePlanExpiredLogout
    );
    return () => {
      window.removeEventListener(
        WINDOW_CUSTOM_EVENTS.PLAN_EXPIRED_LOGOUT,
        handlePlanExpiredLogout
      );
    };
  }, [navigate]);

  useEffect(() => {
    const checkPlanExpiry = () => {
      if (!localStorage.getItem("token")) {
        return;
      }
      if (!isPlanExpiredFromSubscriptionStorage()) {
        return;
      }
      window.dispatchEvent(
        new CustomEvent(WINDOW_CUSTOM_EVENTS.PLAN_EXPIRED_LOGOUT)
      );
    };
    checkPlanExpiry();
    const intervalId = window.setInterval(checkPlanExpiry, 30000);
    return () => window.clearInterval(intervalId);
  }, [location.pathname]);

  useEffect(() => {
    const onSubscriptionStorage = (e) => {
      const detail = e?.detail || {};
      if (!detail.planChanged || detail.silent) {
        return;
      }
      showEmsg(
        i18n.t("SUBSCRIPTION.PLAN_UPDATED_REFRESH", {
          plan: detail.planName || i18n.t("SUBSCRIPTION.DEFAULT_PLAN_LABEL"),
        }),
        "success",
        4500
      );
    };
    window.addEventListener(
      WINDOW_CUSTOM_EVENTS.SUBSCRIPTION_STORAGE_CHANGED,
      onSubscriptionStorage
    );
    return () => {
      window.removeEventListener(
        WINDOW_CUSTOM_EVENTS.SUBSCRIPTION_STORAGE_CHANGED,
        onSubscriptionStorage
      );
    };
  }, []);

  /** Pick up plan / AllowedFeatures changes from backend (same payload shape as login when API includes them on user profile). */
  useEffect(() => {
    const syncProfilePlan = () => {
      if (!localStorage.getItem("token")) {
        return;
      }
      const userId = localStorage.getItem("userId");
      if (!userId) {
        return;
      }
      store.dispatch(fetchUserDetails(userId));
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        syncProfilePlan();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    const intervalId = window.setInterval(syncProfilePlan, 120000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(intervalId);
    };
  }, []);

  // Remove all title attributes to prevent white tooltips
  useEffect(() => {
    // Initial removal
    removeTitleAttributes();

    // Set up MutationObserver to catch dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check the added node itself
            if (node.hasAttribute && node.hasAttribute('title')) {
              const title = node.getAttribute('title');
              node.setAttribute('data-original-title', title);
              node.removeAttribute('title');
            }
            // Check all child elements
            const elementsWithTitle = node.querySelectorAll && node.querySelectorAll('[title]');
            elementsWithTitle.forEach(element => {
              const title = element.getAttribute('title');
              element.setAttribute('data-original-title', title);
              element.removeAttribute('title');
            });
          }
        });
      });
    });

    // Start observing the document body
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup observer on unmount
    return () => observer.disconnect();
  }, []);


  return (
    <Provider store={store}>
      <ThemeProvider>
        <IdleLogout
          isLoggedIn={!!localStorage.getItem("token")}
          onLogout={() => {
            store.dispatch(logout());
            localStorage.removeItem("token");
            localStorage.removeItem("userDetails");
          }}
        />
      <ToastContainer
        position="top-right"
        autoClose={1400}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
      />
      <InactivityManager>
        <AllDataProvider>
          <TitleProvider>
            <LocationDataProvider>
              {/* Removed Suspense wrapper since we're not using lazy loading anymore */}
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Login />} />

                {/* Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.DASHBOARD, PERMISSIONS.VIEW_DASHBOARD)}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* AI Chat Board */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <AiChatBoard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-assistant"
                  element={
                    <ProtectedRoute>
                      <AiChatBoard />
                    </ProtectedRoute>
                  }
                />

                {/* Reason Management / Cancellations */}
                <Route
                  path="/cancellations"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.ORDER, PERMISSIONS.VIEW_ORDERS)}>
                      <Cancellations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cancellations/create"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.ORDER, PERMISSIONS.VIEW_ORDERS)}>
                      <CreateReason />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cancellations/edit/:id"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.ORDER, PERMISSIONS.VIEW_ORDERS)}>
                      <CreateReason />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/upgrade-plan"
                  element={
                    <ProtectedRoute tenantAdminOnly>
                      <PlanGate />
                    </ProtectedRoute>
                  }
                />

                {/* Browse/Product Setup */}
                <Route
                  path="/browse"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.VIEW_PRODUCTS)}>
                      <Browse />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subscription"
                  element={
                    <ProtectedRoute tenantAdminOnly>
                      <SubscriptionPlan />
                    </ProtectedRoute>
                  }
                />
                {/* Payments */}
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PAYMENT, PERMISSIONS.VIEW_PAYMENTS)}>
                      <Payments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-details/:id"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PAYMENT, PERMISSIONS.VIEW_PAYMENT_DETAILS)}>
                      <PaymentDetailsWrapper />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/activeBanners"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.VIEW_PRODUCTS)}>
                      <ActiveBanners />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/browse/editbrand/:id"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.UPDATE_BRAND)}>
                      <CreateBrand />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/browse/editcatagiry/:id"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.UPDATE_CATEGORY)}>
                      <CreateCategory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/browse/editattributetype/:id"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.UPDATE_ATTRIBUTE_TYPE)}>
                      <CreateAttributeType />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/browse/editcolor/:id"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.UPDATE_COLOUR)}>
                      <CreateColor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/browse/editattribute/:id"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.UPDATE_ATTRIBUTE)}>
                      <CreateAttribute />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/browse/editgroup/:id"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.UPDATE_PRODUCT_GROUP)}>
                      <CreateProductGroup />
                    </ProtectedRoute>
                  }
                />

                {/* Orders */}
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.ORDER, PERMISSIONS.VIEW_ORDERS)}>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:orderId"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.ORDER, PERMISSIONS.VIEW_ORDERS)}>
                      <OrderDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* User Roles */}
                <Route
                  path="/userRoles"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.ROLE, PERMISSIONS.VIEW_ROLE)}>
                      <UserRoles />
                    </ProtectedRoute>
                  }
                />

                {/* Products */}
                <Route
                  path="/productList"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.VIEW_PRODUCTS)}>
                      <ProductList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/InventoryList"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.INVENTORY, PERMISSIONS.VIEW_INVENTORY)}>
                      <InventoryList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/Addproduct"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.CREATE_PRODUCT)}>
                      <Addproduct />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/AddVariants"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.ADD_VARIANTS)}>
                      <AddVariants />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-product/:productId?"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.UPDATE_PRODUCT)}>
                      <Addproduct />
                    </ProtectedRoute>
                  }
                />

                {/* Banners */}
                <Route
                  path="/banners-create"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode("Banner Management", PERMISSIONS.CREATE_BANNER)}>
                      <Bannerscreate />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/banners-edit/:bannerId?"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode("Banner Management", PERMISSIONS.UPDATE_BANNER)}>
                      <Bannerscreate />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/banners"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode("Banner Management", PERMISSIONS.VIEW_BANNERS)}>
                      <Banners />
                    </ProtectedRoute>
                  }
                />

                {/* Profile */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfileDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/theme-settings"
                  element={
                    <ProtectedRoute>
                      <ApplicationSettings />
                    </ProtectedRoute>
                  }
                />

                {/* User Role Management */}
                <Route
                  path="/addUserRole"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.ROLE, PERMISSIONS.ADD_ROLE)}>
                      <AddUserRole />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-UserRole/:roleId"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.ROLE, PERMISSIONS.EDIT_ROLE)}>
                      <AddUserRole />
                    </ProtectedRoute>
                  }
                />

                {/* Stores */}
                <Route
                  path="/stores"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.STORE, PERMISSIONS.VIEW_STORE)}>
                      <Stores />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-store"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.STORE, PERMISSIONS.ADD_STORE)}>
                      <AddStore />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editStore/:id"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.STORE, PERMISSIONS.UPDATE_STORE)}>
                      <AddStore />
                    </ProtectedRoute>
                  }
                />

                {/* Users */}
                <Route
                  path="/add-user"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.USER, PERMISSIONS.ADD_USER)}>
                      <AddUser />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editUser/:id"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.USER, PERMISSIONS.UPDATE_USER)}>
                      <AddUser />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.USER, PERMISSIONS.VIEW_USER)}>
                      <Users />
                    </ProtectedRoute>
                  }
                />

                {/* Notifications */}
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode("Notification Management", PERMISSIONS.SEND_NOTIFICATION)}>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />

                {/* Bulk Import */}
                <Route
                  path="/bulk-import"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode("Bulk Import Management", "View Bulk Import")}>
                      <BulkImport />
                    </ProtectedRoute>
                  }
                />

                {/* Bulk Images */}
                <Route
                  path="/bulk-images"
                  element={
                    <ProtectedRoute permissionCode={
                      getPermissionCode("Bulk Import Management", "Bulk Image") ||
                      getPermissionCode("Bulk Import Management", "Upload Bulk Import Images")
                    }>
                      <BulkImages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/productdetails/:productId?"
                  element={
                    <ProtectedRoute>
                      <ProductDetails />
                    </ProtectedRoute>
                  }
                />

                {/* Low Stock */}
                <Route
                  path="/low-stock"
                  element={
                    <ProtectedRoute permissionCode={getPermissionCode(MODULES.PRODUCT, PERMISSIONS.VIEW_PRODUCTS)}>
                      <LowStock />
                    </ProtectedRoute>
                  }
                />

                {/* Not Authorized */}
                <Route path="/not-authorized" element={<NotAuthorized />} />

                {/* 404 Not Found - Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LocationDataProvider>
          </TitleProvider>
        </AllDataProvider>
      </InactivityManager>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
