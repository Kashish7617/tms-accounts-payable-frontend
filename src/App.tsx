import { useState } from "react";
import Sidebar, { type SidebarRoute } from "./components/Sidebar";
import Dashboard from "./screens/Dashboard";
import AccountsManagement from "./screens/AccountsManagement";
import GeneralLedger from "./screens/GeneralLedger";
import InvoiceManagement from "./screens/InvoiceManagement";
import InvoiceEditor from "./screens/InvoiceEditor";
import InvoiceDetails from "./screens/InvoiceDetails";

// Invoices has its own internal view state (list / new / details) since it's
// a multi-step flow, while every other sidebar item maps to one screen.
type InvoiceView = { mode: "list" } | { mode: "create" } | { mode: "details"; invoiceId: string };

export default function App() {
  console.log("addf")
  const [route, setRoute] = useState<SidebarRoute>("dashboard");
  const [invoiceView, setInvoiceView] = useState<InvoiceView>({ mode: "list" });

  function handleNavigate(nextRoute: SidebarRoute) {
    setRoute(nextRoute);
    if (nextRoute === "invoices") setInvoiceView({ mode: "list" });
  }

  function renderInvoices() {
    switch (invoiceView.mode) {
      case "create":
        return (
          <InvoiceEditor
            onCancel={() => setInvoiceView({ mode: "list" })}
            onSaved={(invoiceId) => setInvoiceView({ mode: "details", invoiceId })}
          />
        );
      case "details":
        return (
          <InvoiceDetails invoiceId={invoiceView.invoiceId} onBack={() => setInvoiceView({ mode: "list" })} />
        );
      case "list":
      default:
        return (
          <InvoiceManagement
            onCreateInvoice={() => setInvoiceView({ mode: "create" })}
            onOpenInvoice={(invoiceId) => setInvoiceView({ mode: "details", invoiceId })}
          />
        );
    }
  }

  function renderScreen() {
    switch (route) {
      case "dashboard":
        return <Dashboard />;
      case "accounts":
        return <AccountsManagement />;
      case "ledger":
        return <GeneralLedger />;
      case "invoices":
        return renderInvoices();
      // "transactions", "payments", "reports", "settings" reuse the reference
      // screens above (e.g. Transactions surfaces via Dashboard/Ledger) —
      // wire in dedicated screens here as they're built.
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar active={route} onNavigate={handleNavigate} />
      <main className="flex-1 overflow-hidden">{renderScreen()}</main>
    </div>
  );
}
