import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobile?: boolean;
}

export default function Sidebar({ mobile = false }: SidebarProps) {
  const { logout } = useAuth();
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { 
      section: "MAIN",
      items: [
        { name: "Overview", path: "/dashboard", icon: "chart-pie" },
        { name: "Customers", path: "/customers", icon: "users" }, 
        { name: "Transactions", path: "/transactions", icon: "exchange-alt" },
        { name: "Wallet", path: "/wallet", icon: "wallet", active: true }
      ]
    },
    {
      section: "OTHERS",
      items: [
        { name: "Notifications", path: "/notifications", icon: "bell" },
        { name: "Settings", path: "/settings", icon: "cog" },
        { name: "Help", path: "/help", icon: "question-circle" }
      ]
    }
  ];

  const SidebarLink = ({ name, path, icon, active = false }: { name: string, path: string, icon: string, active?: boolean }) => {
    const isPathActive = active || isActive(path);
    
    return (
      <li>
        <Link 
          href={path}
          className={cn(
            "flex items-center text-sm px-2 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md",
            isPathActive && "bg-sidebar-accent"
          )}
        >
          <i className={`fas fa-${icon} w-5 text-center mr-2 ${isPathActive ? 'text-primary' : ''}`}></i>
          <span>{name}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className={cn(
      "bg-sidebar text-sidebar-foreground w-60 min-h-screen",
      mobile ? "h-full" : "fixed inset-y-0 left-0 hidden md:block overflow-y-auto"
    )}>
      <div className="p-5 flex items-center">
        <div className="flex items-center justify-center bg-primary rounded-full w-8 h-8 text-black font-semibold">C</div>
        <span className="ml-2 text-lg font-semibold">CredPal</span>
      </div>
      
      {/* Navigation */}
      {navItems.map((section, index) => (
        <div key={index} className="px-4 mt-8">
          <p className="text-xs font-medium text-muted-foreground mb-4 px-2">{section.section}</p>
          <ul className="space-y-2">
            {section.items.map((item, itemIndex) => (
              <SidebarLink 
                key={itemIndex} 
                name={item.name} 
                path={item.path} 
                icon={item.icon} 
                active={item.active} 
              />
            ))}
          </ul>
        </div>
      ))}
      
      {/* Logout */}
      <div className="px-4 mt-8">
        <ul className="space-y-2">
          <li>
            <button 
              onClick={logout}
              className="w-full flex items-center text-sm px-2 py-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md"
            >
              <i className="fas fa-sign-out-alt w-5 text-center mr-2"></i>
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
      
      {/* Dark Mode Toggle */}
      <div className="px-6 mt-8 pb-6">
        <label className="flex items-center cursor-pointer">
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
          <span className="ml-3 text-sidebar-foreground text-sm">
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </span>
        </label>
      </div>
    </div>
  );
}
