import React from "react";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border/50 shadow-sm p-4 text-center text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} Nexus POS. All rights reserved.
    </footer>
  );
}