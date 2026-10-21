import { Component, DestroyRef, ElementRef, inject, signal, viewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="layout-shell" role="application" aria-label="Verdant Scholar college management">
      <aside class="sidebar" aria-label="Primary navigation">
        <div class="sidebar-header">
          <a routerLink="/" class="brand-area" aria-label="Verdant Scholar home">
            <div class="brand-mark" aria-hidden="true">C</div>
          </a>
        </div>
        <nav aria-label="Main menu">
          <div class="nav-group">Overview</div>
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link" aria-label="Dashboard">
            <span class="nav-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span>
            <span>Dashboard</span>
          </a>

          <div class="nav-group">MANAGEMENT</div>
          <a routerLink="/students" routerLinkActive="active" class="nav-link" aria-label="Students">
            <span class="nav-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            <span>Students</span>
          </a>
          <a routerLink="/departments" routerLinkActive="active" class="nav-link" aria-label="Departments">
            <span class="nav-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></span>
            <span>Departments</span>
          </a>
          <a routerLink="/subjects" routerLinkActive="active" class="nav-link" aria-label="Subjects">
            <span class="nav-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></span>
            <span>Subjects</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="nav-link" aria-label="Reports">
            <span class="nav-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="12" y2="4"/><line x1="4" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="12"/></svg></span>
            <span>Reports</span>
          </a>
        </nav>
      </aside>

      <div class="main-area">
        <header class="topbar" role="banner">
          <div class="top-left">
            <button #hamburger class="hamburger-btn" (click)="openDrawer()" aria-label="Open navigation menu" [attr.aria-expanded]="drawerOpen() ? 'true' : 'false'" aria-controls="mobile-drawer" type="button">
              <span class="hamburger-bar" aria-hidden="true"></span>
              <span class="hamburger-bar" aria-hidden="true"></span>
              <span class="hamburger-bar" aria-hidden="true"></span>
            </button>
            <a routerLink="/" class="mobile-brand" aria-label="Verdant Scholar home">
              <span class="mobile-brand-mark" aria-hidden="true">C</span>
            </a>
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>
          <div class="top-right" aria-label="User profile">
            <div #profileDropdown class="avatar-dropdown" [attr.aria-expanded]="dropdownOpen() ? 'true' : 'false'">
              <button class="avatar-btn" (click)="toggleDropdown()" aria-label="Profile menu" type="button" title="Profile" [attr.aria-haspopup]="true">
                <span class="avatar" aria-hidden="true">AD</span>
              </button>
              <div class="dropdown-menu" [class.open]="dropdownOpen()" (click)="$event.stopPropagation()" role="menu" aria-label="Profile options">
                <div class="dropdown-header" role="none">
                  <span class="avatar avatar-lg" aria-hidden="true">AD</span>
                  <div>
                    <span class="dropdown-name">{{ displayName() }}</span>
                    <span class="dropdown-sub">{{ displayRole() }}</span>
                  </div>
                </div>
                <div class="dropdown-divider" role="separator"></div>
                <a routerLink="/dashboard" class="dropdown-item" role="menuitem" (click)="closeDropdown()">
                  <span class="dropdown-icon" aria-hidden="true">◈</span>
                  <span>Dashboard</span>
                </a>
                <a routerLink="/reports" class="dropdown-item" role="menuitem" (click)="closeDropdown()">
                  <span class="dropdown-icon" aria-hidden="true">◉</span>
                  <span>Reports</span>
                </a>
                <div class="dropdown-divider" role="separator"></div>
                <button type="button" class="dropdown-item dropdown-item-btn" role="menuitem" (click)="logout()">
                  <span class="dropdown-icon" aria-hidden="true">⏻</span>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        <main class="page-content" role="main">
          <ng-content></ng-content>
        </main>
      </div>

      <div class="drawer-backdrop" [class.open]="drawerOpen()" (click)="closeDrawer()" aria-hidden="true" role="presentation"></div>
      <aside class="mobile-drawer" id="mobile-drawer" [class.open]="drawerOpen()" aria-label="Mobile navigation" role="navigation" aria-modal="true" [attr.aria-hidden]="!drawerOpen() ? 'true' : 'false'">
        <div class="drawer-header">
          <a routerLink="/" class="drawer-brand" aria-label="Verdant Scholar home" (click)="closeDrawer()">
            <span class="brand-mark" aria-hidden="true">C</span>
            <span>Verdant Scholar</span>
          </a>
          <button class="drawer-close" (click)="closeDrawer()" aria-label="Close menu" type="button">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav aria-label="Main menu" class="drawer-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="drawer-link" (click)="closeDrawer()" aria-label="Dashboard">
            <span class="drawer-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/students" routerLinkActive="active" class="drawer-link" (click)="closeDrawer()" aria-label="Students">
            <span class="drawer-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            <span>Students</span>
          </a>
          <a routerLink="/departments" routerLinkActive="active" class="drawer-link" (click)="closeDrawer()" aria-label="Departments">
            <span class="drawer-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></span>
            <span>Departments</span>
          </a>
          <a routerLink="/subjects" routerLinkActive="active" class="drawer-link" (click)="closeDrawer()" aria-label="Subjects">
            <span class="drawer-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></span>
            <span>Subjects</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="drawer-link" (click)="closeDrawer()" aria-label="Reports">
            <span class="drawer-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="12" y2="4"/><line x1="4" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="12"/></svg></span>
            <span>Reports</span>
          </a>
        </nav>
      </aside>
    </div>
  `,
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  pageTitle = 'Dashboard';
  dropdownOpen = signal(false);
  drawerOpen = signal(false);
  private dropdownRef = viewChild<ElementRef>('profileDropdown');
  private hamburgerRef = viewChild<ElementRef>('hamburger');
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  displayName = computed(() => this.authService.user()?.email || 'Guest');
  displayRole = computed(() => this.authService.user()?.role || 'Unknown');

  toggleDropdown() {
    this.dropdownOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
    this.closeDropdown();
    window.location.href = '/login';
  }

  closeDropdown() {
    this.dropdownOpen.set(false);
  }

  openDrawer() {
    this.drawerOpen.set(true);
    this.focusDrawerFirstLink();
  }

  closeDrawer() {
    if (!this.drawerOpen()) return;
    this.drawerOpen.set(false);
    // Return focus to the trigger before the drawer is hidden, so focus is
    // never left inside an aria-hidden element.
    this.restoreFocusToHamburger();
  }

  // Move focus back to the hamburger button that opened the drawer.
  private restoreFocusToHamburger() {
    requestAnimationFrame(() => {
      const btn = this.hamburgerRef()?.nativeElement as HTMLButtonElement | undefined;
      btn?.focus();
    });
  }

  // Focus management for accessibility: focus first nav link when drawer opens.
  focusDrawerFirstLink() {
    // Defer to next tick so the drawer class/open has applied.
    requestAnimationFrame(() => {
      const drawer = document.getElementById('mobile-drawer');
      if (!drawer) return;
      const link = drawer.querySelector<HTMLAnchorElement>('a.drawer-link');
      if (link) link.focus();
    });
  }

  constructor(private router: Router) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      const map: Record<string, string> = {
        '/dashboard': 'Dashboard',
        '/students': 'Students',
        '/departments': 'Departments',
        '/subjects': 'Subjects',
        '/reports': 'Reports',
      };
      const path = e.urlAfterRedirects || e.url;
      const base = path.split('?')[0];
      this.pageTitle = map[base] || (base === '/' ? 'Dashboard' : 'Verdant Scholar');
    });

    // Close when clicking outside the dropdown.
    const onDocClick = (e: MouseEvent) => {
      const el = this.dropdownRef()?.nativeElement as HTMLElement | undefined;
      if (this.dropdownOpen() && el && !el.contains(e.target as Node)) {
        this.closeDropdown();
      }
    };

    // Close when pressing Escape (profile dropdown, then mobile drawer).
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (this.dropdownOpen()) {
        this.closeDropdown();
      } else if (this.drawerOpen()) {
        this.closeDrawer();
      }
    };

    document.addEventListener('click', onDocClick, { passive: true });
    document.addEventListener('keydown', onKeydown);

    this.destroyRef.onDestroy(() => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeydown);
    });
  }
}
