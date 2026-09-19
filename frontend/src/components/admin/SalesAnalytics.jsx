import React, { useMemo } from "react";
import { TrendingUp, ShoppingBag, DollarSign, Award, Truck, CheckCircle2, Clock, XCircle, CreditCard, Banknote } from "lucide-react";

export function SalesAnalytics({ orders = [], products = [] }) {
  const analytics = useMemo(() => {
    const validOrders = orders.filter((o) => (o.status || "").toUpperCase() !== "CANCELLED");
    const cancelledOrders = orders.filter((o) => (o.status || "").toUpperCase() === "CANCELLED");

    // Total Revenue & AOV
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const aov = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    // Status breakdown
    const statusCounts = {
      PLACED: 0,
      CONFIRMED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: cancelledOrders.length,
    };

    orders.forEach((o) => {
      const s = (o.status || "PLACED").toUpperCase();
      if (statusCounts[s] !== undefined && s !== "CANCELLED") {
        statusCounts[s] += 1;
      }
    });

    // Payment method split
    let codCount = 0;
    let upiCount = 0;
    let codRevenue = 0;
    let upiRevenue = 0;

    validOrders.forEach((o) => {
      const isCod = (o.paymentMethod || "COD").toUpperCase().includes("COD");
      if (isCod) {
        codCount += 1;
        codRevenue += Number(o.total) || 0;
      } else {
        upiCount += 1;
        upiRevenue += Number(o.total) || 0;
      }
    });

    // Top-selling pieces aggregated
    const productSales = {};
    orders.forEach((o) => {
      if ((o.status || "").toUpperCase() === "CANCELLED") return;
      if (typeof o.items === "string") {
        // Parse items string e.g. "Celeste Tennis Bracelet (x1)"
        const parts = o.items.split(",");
        parts.forEach((p) => {
          const match = p.trim().match(/^(.*?)(?:\s*\(x(\d+)\))?$/);
          if (match) {
            const name = match[1].trim();
            const qty = match[2] ? parseInt(match[2], 10) : 1;
            productSales[name] = (productSales[name] || 0) + qty;
          }
        });
      } else if (Array.isArray(o.items)) {
        o.items.forEach((it) => {
          const name = it.name || "Jewelry Piece";
          const qty = Number(it.quantity) || 1;
          productSales[name] = (productSales[name] || 0) + qty;
        });
      }
    });

    const topSelling = Object.entries(productSales)
      .map(([name, units]) => {
        const prod = products.find((p) => p.name.toLowerCase() === name.toLowerCase());
        const price = prod ? prod.price : 2499;
        return {
          name,
          units,
          estimatedRevenue: units * price,
          image: prod?.image || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
        };
      })
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    // Group orders by recent 7 dates
    const dailyVolume = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      dailyVolume[key] = { orders: 0, revenue: 0 };
    }

    orders.forEach((o) => {
      if ((o.status || "").toUpperCase() === "CANCELLED") return;
      let dateKey = "";
      if (o.createdAt) {
        try {
          dateKey = new Date(o.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        } catch {
          // ignore
        }
      }
      if (!dateKey || !dailyVolume[dateKey]) {
        // distribute to today or latest day
        const todayKey = Object.keys(dailyVolume)[Object.keys(dailyVolume).length - 1];
        if (dailyVolume[todayKey]) {
          dailyVolume[todayKey].orders += 1;
          dailyVolume[todayKey].revenue += Number(o.total) || 0;
        }
      } else {
        dailyVolume[dateKey].orders += 1;
        dailyVolume[dateKey].revenue += Number(o.total) || 0;
      }
    });

    return {
      validOrdersCount: validOrders.length,
      totalRevenue,
      aov,
      statusCounts,
      codCount,
      upiCount,
      codRevenue,
      upiRevenue,
      topSelling,
      dailyVolume: Object.entries(dailyVolume).map(([date, data]) => ({ date, ...data })),
    };
  }, [orders, products]);

  const maxDailyRevenue = Math.max(...analytics.dailyVolume.map((d) => d.revenue), 10000);

  return (
    <div className="analytics-dashboard">
      {/* Revenue & AOV KPI Cards */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card gold-border">
          <div className="kpi-header">
            <span className="kpi-title">Gross Store Revenue</span>
            <div className="kpi-icon-badge gold">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">₹{analytics.totalRevenue.toLocaleString("en-IN")}</div>
          <div className="kpi-sub">
            Across <strong>{analytics.validOrdersCount}</strong> completed / active customer orders
          </div>
        </div>

        <div className="analytics-kpi-card emerald-border">
          <div className="kpi-header">
            <span className="kpi-title">Average Order Value (AOV)</span>
            <div className="kpi-icon-badge emerald">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value">₹{analytics.aov.toLocaleString("en-IN")}</div>
          <div className="kpi-sub">
            Average basket size per purchasing client
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Order Fulfillment Rate</span>
            <div className="kpi-icon-badge blue">
              <Truck size={18} />
            </div>
          </div>
          <div className="kpi-value">
            {orders.length > 0
              ? `${Math.round(((orders.length - analytics.statusCounts.CANCELLED) / orders.length) * 100)}%`
              : "100%"}
          </div>
          <div className="kpi-sub">
            <strong>{analytics.statusCounts.DELIVERED + analytics.statusCounts.SHIPPED}</strong> orders in transit or delivered
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Payment Preference</span>
            <div className="kpi-icon-badge purple">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: "20px" }}>
            {analytics.codCount} COD / {analytics.upiCount} Online
          </div>
          <div className="kpi-sub">
            ₹{analytics.upiRevenue.toLocaleString("en-IN")} collected online prepaid
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="analytics-charts-grid" style={{ marginTop: "24px" }}>
        {/* Daily Order Volume & Revenue Trend */}
        <div className="analytics-card chart-card">
          <div className="analytics-card-header">
            <div>
              <h3>Daily Orders & Revenue Trend</h3>
              <small>Last 7 days storefront velocity and order volume</small>
            </div>
            <span className="badge-pill">7-Day Trajectory</span>
          </div>

          <div className="bar-chart-container">
            {analytics.dailyVolume.map((item, idx) => {
              const heightPercent = Math.max(12, Math.min(100, Math.round((item.revenue / maxDailyRevenue) * 100)));
              return (
                <div key={idx} className="bar-column">
                  <div className="bar-value-label">
                    {item.revenue > 0 ? `₹${(item.revenue / 1000).toFixed(1)}k` : "0"}
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ height: `${heightPercent}%` }}
                      title={`${item.date}: ₹${item.revenue.toLocaleString("en-IN")} (${item.orders} orders)`}
                    ></div>
                  </div>
                  <div className="bar-date-label">{item.date}</div>
                  <div className="bar-order-count">{item.orders} {item.orders === 1 ? "order" : "orders"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Fulfillment Pipeline</h3>
              <small>Live status distribution of customer orders</small>
            </div>
          </div>

          <div className="status-meters-list">
            <div className="status-meter-row">
              <div className="meter-label">
                <span className="status-dot placed"></span>
                <span>Order Placed</span>
              </div>
              <div className="meter-bar-track">
                <div
                  className="meter-bar-fill placed"
                  style={{
                    width: `${orders.length > 0 ? (analytics.statusCounts.PLACED / orders.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <strong>{analytics.statusCounts.PLACED}</strong>
            </div>

            <div className="status-meter-row">
              <div className="meter-label">
                <span className="status-dot confirmed"></span>
                <span>Confirmed / Processing</span>
              </div>
              <div className="meter-bar-track">
                <div
                  className="meter-bar-fill confirmed"
                  style={{
                    width: `${orders.length > 0 ? (analytics.statusCounts.CONFIRMED / orders.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <strong>{analytics.statusCounts.CONFIRMED}</strong>
            </div>

            <div className="status-meter-row">
              <div className="meter-label">
                <span className="status-dot shipped"></span>
                <span>Shipped / In Transit</span>
              </div>
              <div className="meter-bar-track">
                <div
                  className="meter-bar-fill shipped"
                  style={{
                    width: `${orders.length > 0 ? (analytics.statusCounts.SHIPPED / orders.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <strong>{analytics.statusCounts.SHIPPED}</strong>
            </div>

            <div className="status-meter-row">
              <div className="meter-label">
                <span className="status-dot delivered"></span>
                <span>Delivered</span>
              </div>
              <div className="meter-bar-track">
                <div
                  className="meter-bar-fill delivered"
                  style={{
                    width: `${orders.length > 0 ? (analytics.statusCounts.DELIVERED / orders.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <strong>{analytics.statusCounts.DELIVERED}</strong>
            </div>

            <div className="status-meter-row">
              <div className="meter-label">
                <span className="status-dot cancelled"></span>
                <span>Cancelled (Restocked)</span>
              </div>
              <div className="meter-bar-track">
                <div
                  className="meter-bar-fill cancelled"
                  style={{
                    width: `${orders.length > 0 ? (analytics.statusCounts.CANCELLED / orders.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <strong>{analytics.statusCounts.CANCELLED}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Top-Selling Jewelry Pieces Leaderboard */}
      <div className="analytics-card" style={{ marginTop: "24px" }}>
        <div className="analytics-card-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Award size={18} color="#8a6d2b" />
              <h3>Top-Selling Jewelry Pieces</h3>
            </div>
            <small>Best-performing designs ranked by client demand and units sold</small>
          </div>
        </div>

        <div className="top-selling-grid">
          {analytics.topSelling.length > 0 ? (
            analytics.topSelling.map((piece, index) => (
              <div key={index} className="top-selling-item">
                <div className="rank-badge">#{index + 1}</div>
                <img src={piece.image} alt={piece.name} className="piece-thumb" />
                <div className="piece-info">
                  <strong>{piece.name}</strong>
                  <div className="piece-stats">
                    <span className="units-tag">{piece.units} {piece.units === 1 ? "unit sold" : "units sold"}</span>
                    <span className="revenue-tag">≈ ₹{piece.estimatedRevenue.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "var(--muted)", padding: "16px", fontStyle: "italic" }}>
              No sales data recorded yet. Top jewelry designs will appear here as orders arrive.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
