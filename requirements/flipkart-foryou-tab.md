# Flipkart "For You" Tab — Complete Requirements

**Application:** Flipkart (https://www.flipkart.com/)
**Feature:** For You Tab (Default Homepage)
**Date Explored:** 2026-07-26
**Browser Mode:** Headed (Chrome)
**Auth State:** Non-authenticated user
**Current Version:** 1.10

---

## Table of Contents

1. [Header Section](#1-header-section) — v1.0
2. [Navigation Tab Bar](#2-navigation-tab-bar) — v1.1
3. [Hero Banner Carousel](#3-hero-banner-carousel) — v1.2
4. [Trends You May Like](#4-trends-you-may-like) — v1.3
5. [Trending Gadgets & Appliances](#5-trending-gadgets--appliances) — v1.4
6. [Top Value Deals](#6-top-value-deals) — v1.5
7. [Grab or Gone](#7-grab-or-gone) — v1.6
8. [Make Your Home Stylish](#8-make-your-home-stylish) — v1.7
9. [Brands in Spotlight](#9-brands-in-spotlight) — v1.8
10. [Footer Section](#10-footer-section) — v1.9
11. [Cross-Cutting Concerns](#11-cross-cutting-concerns) — v1.10

---

## 1. Header Section
**Release Version:** 1.0

### 1.1 Logo & Brand Area

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| HEADER-001 | Verify Flipkart logo is displayed | Positive | Logo visible in top-left corner |
| HEADER-002 | Verify logo is clickable | Positive | Clicking logo navigates to homepage |
| HEADER-003 | Verify brand banner (Flipkart Plus) is displayed | Positive | Banner visible next to logo |

### 1.2 Location Selector

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| HEADER-004 | Verify "Location not set" text is displayed | Positive | Text "Location not set" visible |
| HEADER-005 | Verify "Select delivery location" text is displayed | Positive | Helper text visible below location |
| HEADER-006 | Click on location selector | Positive | Location selection modal/dropdown opens |
| HEADER-007 | Verify location icon is displayed | Positive | Map pin icon visible |

### 1.3 Search Bar

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| HEADER-008 | Verify search input field is displayed | Positive | Input field with placeholder visible |
| HEADER-009 | Verify search icon button is displayed | Positive | Magnifying glass icon visible |
| HEADER-010 | Click on search input field | Positive | Input field gains focus, cursor appears |
| HEADER-011 | Type valid search term "phone" | Positive | Search suggestions dropdown appears |
| HEADER-012 | Verify search suggestions contain relevant results | Positive | Suggestions like "phone under 15000", "phone under 10000" appear |
| HEADER-013 | Click on a search suggestion | Positive | Navigates to search results page |
| HEADER-014 | Press Enter with empty search | Negative | No navigation, stays on homepage |
| HEADER-015 | Type special characters "!@#$%^&*" | Negative | No crash, search handles gracefully |
| HEADER-016 | Type very long search term (100+ chars) | Negative | Input truncates or handles gracefully |
| HEADER-017 | Clear search input after typing | Positive | Input clears, suggestions disappear |
| HEADER-018 | Click search icon with empty input | Negative | No navigation, stays on homepage |
| HEADER-019 | Click search icon with valid input | Positive | Navigates to search results page |
| HEADER-020 | Verify search input placeholder text | Positive | Placeholder shows "Search for Products, Brands and More" |

### 1.4 Login Button

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| HEADER-021 | Verify "Login" button is displayed | Positive | Button with user icon visible |
| HEADER-022 | Click on Login button | Positive | Login modal/page opens |
| HEADER-023 | Verify login dropdown on hover | Positive | Dropdown with "New customer? Sign Up" and other options appears |

### 1.5 More Menu

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| HEADER-024 | Verify "More" button is displayed | Positive | Button with chevron icon visible |
| HEADER-025 | Click on "More" button | Positive | Dropdown menu opens |
| HEADER-026 | Verify dropdown contains navigation options | Positive | Menu items visible |

### 1.6 Cart

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| HEADER-027 | Verify Cart icon is displayed | Positive | Cart icon with text "Cart" visible |
| HEADER-028 | Click on Cart button | Positive | Navigates to cart page |
| HEADER-029 | Verify cart shows item count (if items present) | Positive | Badge with number displayed |

---

## 2. Navigation Tab Bar
**Release Version:** 1.1

### 2.1 Tab Display

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| TAB-001 | Verify "For You" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-002 | Verify "Fashion" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-003 | Verify "Mobiles" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-004 | Verify "Electronics" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-005 | Verify "Beauty" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-006 | Verify "Home" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-007 | Verify "Appliances" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-008 | Verify "Toys, baby.." tab is displayed | Positive | Tab visible in navigation bar |
| TAB-009 | Verify "Food & Health" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-010 | Verify "Auto Accessories" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-011 | Verify "Sports & Fitness" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-012 | Verify "Furniture" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-013 | Verify "Books & Media" tab is displayed | Positive | Tab visible in navigation bar |
| TAB-014 | Verify "2 Wheelers" tab is displayed | Positive | Tab visible in navigation bar |

### 2.2 Tab Active State

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| TAB-015 | Verify "For You" tab is active by default | Positive | Tab has active indicator (underline/highlight) |
| TAB-016 | Verify active tab has different visual style | Positive | Active tab color/background differs from inactive |

### 2.3 Tab Click Behavior

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| TAB-017 | Click on "For You" tab | Positive | Page refreshes/stays on homepage |
| TAB-018 | Click on "Fashion" tab | Positive | Navigates to Fashion category page |
| TAB-019 | Click on "Mobiles" tab | Positive | Navigates to Mobiles category page |
| TAB-020 | Click on "Electronics" tab | Positive | Navigates to Electronics category page |
| TAB-021 | Click on "Beauty" tab | Positive | Navigates to Beauty category page |
| TAB-022 | Click on "Home" tab | Positive | Navigates to Home category page |
| TAB-023 | Click on "Appliances" tab | Positive | Navigates to Appliances category page |
| TAB-024 | Click on "Toys, baby.." tab | Positive | Navigates to Toys category page |
| TAB-025 | Click on "Food & Health" tab | Positive | Navigates to Food & Health category page |
| TAB-026 | Click on "Auto Accessories" tab | Positive | Navigates to Auto Accessories category page |
| TAB-027 | Click on "Sports & Fitness" tab | Positive | Navigates to Sports & Fitness category page |
| TAB-028 | Click on "Furniture" tab | Positive | Navigates to Furniture category page |
| TAB-029 | Click on "Books & Media" tab | Positive | Navigates to Books & Media category page |
| TAB-030 | Click on "2 Wheelers" tab | Positive | Navigates to 2 Wheelers category page |

### 2.4 Tab Scroll (Mobile)

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| TAB-031 | Verify tabs are horizontally scrollable on mobile | Positive | Tabs scroll left/right on mobile viewport |
| TAB-032 | Swipe left on tab bar | Positive | More tabs become visible |
| TAB-033 | Swipe right on tab bar | Positive | Previous tabs become visible |

### 2.5 Tab Keyboard Navigation

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| TAB-034 | Press Tab key to focus on tab bar | Positive | First tab gains focus |
| TAB-035 | Press Arrow Right to move focus | Positive | Focus moves to next tab |
| TAB-036 | Press Arrow Left to move focus | Positive | Focus moves to previous tab |
| TAB-037 | Press Enter on focused tab | Positive | Tab is activated, page navigates |

---

## 3. Hero Banner Carousel
**Release Version:** 1.2

### 3.1 Banner Display

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| BANNER-001 | Verify main banner carousel is displayed | Positive | Large banner image visible |
| BANNER-002 | Verify banner image loads without broken icon | Positive | Image displays correctly |
| BANNER-003 | Verify banner has clickable link | Positive | Clicking banner navigates to offer page |

### 3.2 Banner Carousel Navigation

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| BANNER-004 | Verify carousel auto-rotates | Positive | Banner changes automatically after few seconds |
| BANNER-005 | Click on carousel next arrow | Positive | Next banner slides in |
| BANNER-006 | Click on carousel previous arrow | Positive | Previous banner slides in |
| BANNER-007 | Click on carousel dot indicator | Positive | Jumps to that specific banner |

### 3.3 Banner Click

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| BANNER-008 | Click on banner | Positive | Navigates to offer/category page |
| BANNER-009 | Click on banner and verify URL | Positive | URL contains offer parameters |
| BANNER-010 | Click banner, then navigate back | Positive | Returns to For You tab |

### 3.4 Banner Negative Cases

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| BANNER-011 | Verify banner handles slow network | Negative | Loading indicator or placeholder shown |
| BANNER-012 | Verify banner handles image load failure | Negative | Fallback image or no broken icon |
| BANNER-013 | Verify banner carousel does not block page rendering | Negative | Page remains interactive during rotation |

---

## 4. Trends You May Like
**Release Version:** 1.3

### 4.1 Section Display

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| TRENDS-001 | Verify "Trends you may like" section title is displayed | Positive | Section title visible |
| TRENDS-002 | Verify trend cards are displayed | Positive | Multiple trend cards visible |

### 4.2 Trend Cards

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| TRENDS-003 | Verify "HealthyCooking" trend card is displayed | Positive | Card with image and text visible |
| TRENDS-004 | Verify "Korean" trend card is displayed | Positive | Card with image and text visible |
| TRENDS-005 | Verify "Tassel" trend card is displayed | Positive | Card with image and text visible |
| TRENDS-006 | Verify "Court Sneakers" trend card is displayed | Positive | Card with image and text visible |
| TRENDS-007 | Click on a trend card | Positive | Navigates to trend page |
| TRENDS-008 | Verify trend card images load correctly | Positive | Images display without broken icons |

---

## 5. Trending Gadgets & Appliances
**Release Version:** 1.4

### 5.1 Section Display

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| GADGETS-001 | Verify "Trending Gadgets & Appliances" section title is displayed | Positive | Section title visible |
| GADGETS-002 | Verify "View All" link is displayed | Positive | Link/button visible |

### 5.2 Category Cards

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| GADGETS-003 | Verify "True Wireless" card is displayed | Positive | Card with image and discount visible |
| GADGETS-004 | Verify "Neckband" card is displayed | Positive | Card with image and discount visible |
| GADGETS-005 | Verify "Smart Watches" card is displayed | Positive | Card with image and discount visible |
| GADGETS-006 | Verify "Mobile Speakers" card is displayed | Positive | Card with image and discount visible |
| GADGETS-007 | Verify discount text is displayed (e.g., "Min. 50% Off") | Positive | Discount percentage visible |
| GADGETS-008 | Click on a category card | Positive | Navigates to filtered product listing |
| GADGETS-009 | Click on "View All" link | Positive | Navigates to all gadgets page |

---

## 6. Top Value Deals
**Release Version:** 1.5

### 6.1 Section Display

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| TOPDEALS-001 | Verify "Top Value Deals" section title is displayed | Positive | Section title visible with icon |

### 6.2 Product Grid

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| TOPDEALS-002 | Verify product cards are displayed | Positive | Multiple product images visible |
| TOPDEALS-003 | Verify product cards have clickable links | Positive | Each card is clickable |
| TOPDEALS-004 | Click on a product card | Positive | Navigates to product detail page |
| TOPDEALS-005 | Verify right arrow button for scrolling | Positive | Arrow button visible |
| TOPDEALS-006 | Click right arrow to scroll | Positive | More products become visible |
| TOPDEALS-007 | Verify lazy loading of products | Positive | Products load as user scrolls |

### 6.3 Top Value Deals Negative Cases

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| TOPDEALS-008 | Verify product images handle load failure | Negative | Placeholder image shown, no broken icon |
| TOPDEALS-009 | Verify scroll does not break layout | Negative | Smooth scrolling, no jank |

---

## 7. Grab or Gone
**Release Version:** 1.6

### 7.1 Section Display

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| GRAB-001 | Verify "Grab or gone" section title is displayed | Positive | Section title visible |
| GRAB-002 | Verify 4 deal cards are displayed | Positive | Four cards visible in horizontal layout |

### 7.2 Deal Cards

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| GRAB-003 | Verify "Top Sellers" card is displayed | Positive | Card with image, title, and badge visible |
| GRAB-004 | Verify "Grab Or Gone" card is displayed | Positive | Card with image, title, and badge visible |
| GRAB-005 | Verify "In Focus Now" card is displayed | Positive | Card with image, title, and badge visible |
| GRAB-006 | Verify "Widest Range" card is displayed | Positive | Card with image, title, and badge visible |
| GRAB-007 | Verify discount text is displayed (e.g., "Min. 70% Off") | Positive | Discount percentage visible |
| GRAB-008 | Verify badge text is displayed (e.g., "Top Rated", "Special offer") | Positive | Badge visible on card |
| GRAB-009 | Click on "Top Sellers" card | Positive | Navigates to product listing |
| GRAB-010 | Click on "Grab Or Gone" card | Positive | Navigates to product listing |
| GRAB-011 | Click on "In Focus Now" card | Positive | Navigates to product listing |
| GRAB-012 | Click on "Widest Range" card | Positive | Navigates to product listing |
| GRAB-013 | Click deal card, then navigate back | Positive | Returns to For You tab |

---

## 8. Make Your Home Stylish
**Release Version:** 1.7

### 8.1 Section Display

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| HOME-001 | Verify "Make your home stylish" section title is displayed | Positive | Section title visible |
| HOME-002 | Verify "View All" link is displayed | Positive | Link/button visible |

### 8.2 Category Cards

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| HOME-003 | Verify "Mop Set" card is displayed | Positive | Card with image and text visible |
| HOME-004 | Verify "Water Bottles & Flasks" card is displayed | Positive | Card with image and text visible |
| HOME-005 | Verify "Choppers & Slicers" card is displayed | Positive | Card with image and text visible |
| HOME-006 | Verify "Pressure Cookers" card is displayed | Positive | Card with image and text visible |
| HOME-007 | Verify discount/badge text is displayed | Positive | Text like "Top Sellers", "Special offer", "Min. 50% Off" visible |
| HOME-008 | Click on a category card | Positive | Navigates to filtered product listing |
| HOME-009 | Click on "View All" link | Positive | Navigates to all home products page |

---

## 9. Brands in Spotlight
**Release Version:** 1.8

### 9.1 Section Display

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| BRANDS-001 | Verify "Brands in Spotlight" section title is displayed | Positive | Section title visible |
| BRANDS-002 | Verify brand cards are displayed | Positive | Multiple brand cards visible |

### 9.2 Brand Cards

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| BRANDS-003 | Verify Samsung brand card is displayed | Positive | Brand logo/image visible |
| BRANDS-004 | Verify Fire-boltt brand card is displayed | Positive | Brand logo/image visible |
| BRANDS-005 | Click on a brand card | Positive | Navigates to brand page |
| BRANDS-006 | Verify brand images load correctly | Positive | Images display without broken icons |

---

## 10. Footer Section
**Release Version:** 1.9

### 10.1 Footer Links - ABOUT

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| FOOTER-001 | Verify "Contact Us" link is displayed | Positive | Link visible in ABOUT section |
| FOOTER-002 | Click "Contact Us" link | Positive | Navigates to help/contact page |
| FOOTER-003 | Verify "About Us" link is displayed | Positive | Link visible in ABOUT section |
| FOOTER-004 | Click "About Us" link | Positive | Navigates to corporate page |
| FOOTER-005 | Verify "Careers" link is displayed | Positive | Link visible in ABOUT section |
| FOOTER-006 | Click "Careers" link | Positive | Navigates to careers page |
| FOOTER-007 | Verify "Flipkart Stories" link is displayed | Positive | Link visible in ABOUT section |
| FOOTER-008 | Verify "Press" link is displayed | Positive | Link visible in ABOUT section |
| FOOTER-009 | Verify "Corporate Information" link is displayed | Positive | Link visible in ABOUT section |

### 10.2 Footer Links - GROUP COMPANIES

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| FOOTER-010 | Verify "Myntra" link is displayed | Positive | Link visible in GROUP COMPANIES section |
| FOOTER-011 | Click "Myntra" link | Positive | Opens Myntra website in new tab |
| FOOTER-012 | Verify "Cleartrip" link is displayed | Positive | Link visible in GROUP COMPANIES section |
| FOOTER-013 | Click "Cleartrip" link | Positive | Opens Cleartrip website in new tab |
| FOOTER-014 | Verify "Shopsy" link is displayed | Positive | Link visible in GROUP COMPANIES section |
| FOOTER-015 | Click "Shopsy" link | Positive | Opens Shopsy website in new tab |

### 10.3 Footer Links - HELP

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| FOOTER-016 | Verify "Payments" link is displayed | Positive | Link visible in HELP section |
| FOOTER-017 | Click "Payments" link | Positive | Navigates to payments page |
| FOOTER-018 | Verify "Shipping" link is displayed | Positive | Link visible in HELP section |
| FOOTER-019 | Click "Shipping" link | Positive | Navigates to shipping page |
| FOOTER-020 | Verify "Cancellation & Returns" link is displayed | Positive | Link visible in HELP section |
| FOOTER-021 | Click "Cancellation & Returns" link | Positive | Navigates to cancellation page |
| FOOTER-022 | Verify "FAQ" link is displayed | Positive | Link visible in HELP section |
| FOOTER-023 | Click "FAQ" link | Positive | Navigates to FAQ page |

### 10.4 Footer Links - CONSUMER POLICY

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| FOOTER-024 | Verify "Terms Of Use" link is displayed | Positive | Link visible in CONSUMER POLICY section |
| FOOTER-025 | Click "Terms Of Use" link | Positive | Navigates to terms page |
| FOOTER-026 | Verify "Security" link is displayed | Positive | Link visible in CONSUMER POLICY section |
| FOOTER-027 | Click "Security" link | Positive | Navigates to security page |
| FOOTER-028 | Verify "Privacy" link is displayed | Positive | Link visible in CONSUMER POLICY section |
| FOOTER-029 | Click "Privacy" link | Positive | Navigates to privacy page |
| FOOTER-030 | Verify "Sitemap" link is displayed | Positive | Link visible in CONSUMER POLICY section |
| FOOTER-031 | Click "Sitemap" link | Positive | Navigates to sitemap page |
| FOOTER-032 | Verify "Grievance Redressal" link is displayed | Positive | Link visible in CONSUMER POLICY section |
| FOOTER-033 | Verify "EPR Compliance" link is displayed | Positive | Link visible in CONSUMER POLICY section |

### 10.5 Contact Information

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| FOOTER-034 | Verify "Mail Us:" section is displayed | Positive | Section visible |
| FOOTER-035 | Verify registered office address is displayed | Positive | Address text visible |
| FOOTER-036 | Verify "Social:" section is displayed | Positive | Section visible |
| FOOTER-037 | Verify "Facebook" link is displayed | Positive | Link visible |
| FOOTER-038 | Click "Facebook" link | Positive | Opens Facebook page in new tab |
| FOOTER-039 | Verify "Twitter" link is displayed | Positive | Link visible |
| FOOTER-040 | Click "Twitter" link | Positive | Opens Twitter page in new tab |
| FOOTER-041 | Verify "YouTube" link is displayed | Positive | Link visible |
| FOOTER-042 | Click "YouTube" link | Positive | Opens YouTube page in new tab |
| FOOTER-043 | Verify "Instagram" link is displayed | Positive | Link visible |
| FOOTER-044 | Click "Instagram" link | Positive | Opens Instagram page in new tab |
| FOOTER-045 | Verify "Registered Office Address:" section is displayed | Positive | Section visible |
| FOOTER-046 | Verify phone numbers are displayed | Positive | "044-45614700" and "044-67415800" visible |
| FOOTER-047 | Click on phone number link | Positive | Initiates call or copies number |

### 10.6 Additional Links

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| FOOTER-048 | Verify "Become a Seller" link is displayed | Positive | Link with icon visible |
| FOOTER-049 | Click "Become a Seller" link | Positive | Opens seller portal in new tab |
| FOOTER-050 | Verify "Advertise" link is displayed | Positive | Link with icon visible |
| FOOTER-051 | Verify "Gift Cards" link is displayed | Positive | Link with icon visible |
| FOOTER-052 | Click "Gift Cards" link | Positive | Navigates to gift cards page |
| FOOTER-053 | Verify "Help Center" link is displayed | Positive | Link with icon visible |
| FOOTER-054 | Click "Help Center" link | Positive | Navigates to help center page |
| FOOTER-055 | Verify copyright notice is displayed | Positive | "© 2007-2026 Flipkart.com" visible |
| FOOTER-056 | Verify payment methods icons are displayed | Positive | Icons for various payment methods visible |

---

## 11. Cross-Cutting Concerns
**Release Version:** 1.10

### 11.1 Responsive Design - Mobile (375px width)

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| RESP-001 | Verify tab bar is horizontally scrollable on mobile | Positive | Tabs scroll left/right |
| RESP-002 | Verify deal cards stack or scroll horizontally on mobile | Positive | Layout adapts to mobile |
| RESP-003 | Verify footer sections collapse/stack vertically on mobile | Positive | Footer is readable |
| RESP-004 | Verify search bar is full width on mobile | Positive | Search input spans full width |
| RESP-005 | Verify banner image scales correctly on mobile | Positive | Image does not overflow |

### 11.2 Responsive Design - Tablet (768px width)

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| RESP-006 | Verify layout adapts to tablet viewport | Positive | Content reflows appropriately |
| RESP-007 | Verify deal cards display in grid on tablet | Positive | Grid layout visible |

### 11.3 Responsive Design - Desktop (1280px width)

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| RESP-008 | Verify all tabs visible without scroll on desktop | Positive | All 14 tabs visible |
| RESP-009 | Verify deal cards display in grid layout on desktop | Positive | Grid layout visible |
| RESP-010 | Verify footer sections display in columns on desktop | Positive | Multi-column footer |

### 11.4 Performance

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| PERF-001 | Verify "For You" tab content loads within 3 seconds | Positive | Content visible within 3s |
| PERF-002 | Verify images lazy load as user scrolls | Positive | Images load on scroll |
| PERF-003 | Verify banner carousel does not block page rendering | Positive | Page remains interactive |
| PERF-004 | Verify no layout shift during image load | Positive | Content does not jump |

### 11.5 Accessibility

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| A11Y-001 | Verify all tabs are focusable via keyboard | Positive | Tab key navigates to tabs |
| A11Y-002 | Verify deal cards are navigable via keyboard | Positive | Tab key navigates to cards |
| A11Y-003 | Verify search input is focusable via keyboard | Positive | Tab key focuses search |
| A11Y-004 | Verify all images have alt text | Positive | Screen readers can read images |
| A11Y-005 | Verify tab states are announced to screen readers | Positive | Active/inactive state announced |
| A11Y-006 | Verify deal card content is readable by screen readers | Positive | Content accessible |

### 11.6 Error Handling

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| ERROR-001 | Verify image load failure shows placeholder | Negative | Placeholder image shown |
| ERROR-002 | Verify banner does not show broken image icon | Negative | No broken icon visible |
| ERROR-003 | Verify API failure shows error message | Negative | Error message displayed |
| ERROR-004 | Verify retry mechanism for failed loads | Negative | User can retry loading |
| ERROR-005 | Verify no JavaScript errors on page | Negative | Console shows no critical errors |

### 11.7 Browser Compatibility

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| COMPAT-001 | Verify functionality on Chrome | Positive | All features work |
| COMPAT-002 | Verify functionality on Firefox | Positive | All features work |
| COMPAT-003 | Verify functionality on Safari | Positive | All features work |
| COMPAT-004 | Verify functionality on Edge | Positive | All features work |

### 11.8 Navigation & State

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| NAV-001 | Refresh page and verify For You tab remains active | Positive | Tab stays active after refresh |
| NAV-002 | Navigate away and use browser back button | Positive | Returns to For You tab |
| NAV-003 | Click on deal card, navigate back | Positive | Returns to For You tab |
| NAV-004 | Click on product, navigate back multiple times | Positive | History works correctly |

### 11.9 Security

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| SEC-001 | Verify all links use HTTPS | Positive | No mixed content warnings |
| SEC-002 | Verify no sensitive data exposed in URLs | Positive | No tokens/passwords in URL |
| SEC-003 | Verify XSS prevention in search input | Negative | Script tags not executed |

### 11.10 Analytics & Tracking

| ID | Scenario | Type | Expected Result |
|----|----------|------|-----------------|
| ANALYTICS-001 | Verify tab clicks are tracked | Positive | Event sent to analytics |
| ANALYTICS-002 | Verify banner impressions are tracked | Positive | Impression event sent |
| ANALYTICS-003 | Verify banner clicks are tracked | Positive | Click event sent |
| ANALYTICS-004 | Verify deal card clicks are tracked | Positive | Click event sent |
| ANALYTICS-005 | Verify product card clicks are tracked | Positive | Click event sent |

---

## Appendix A: Element Selectors Reference

### Header Elements
| Element | Selector |
|---------|----------|
| Search Input | `textbox "Search for Products, Brands and More"` |
| Search Button | `button "Search for Products, Brands and More"` |
| Login Button | `link "Login"` |
| More Button | `link "More"` |
| Cart Button | `link "Cart Cart"` |
| Location Text | `generic "Location not set"` |

### Navigation Tabs
| Tab | Selector |
|-----|----------|
| For You | `link "For You"` |
| Fashion | `link "Fashion"` |
| Mobiles | `link "Mobiles"` |
| Electronics | `link "Electronics"` |
| Beauty | `link "Beauty"` |
| Home | `link "Home"` |
| Appliances | `link "Appliances"` |
| Toys, baby.. | `link "Toys, baby.."` |
| Food & Health | `link "Food & Health"` |
| Auto Accessories | `link "Auto Accessories"` |
| Sports & Fitness | `link "Sports & Fitness"` |
| Furniture | `link "Furniture"` |
| Books & Media | `link "Books & Media"` |
| 2 Wheelers | `link "2 Wheelers"` |

### Section Titles
| Section | Selector |
|---------|----------|
| Trends you may like | `generic "Trends you may like"` |
| Trending Gadgets & Appliances | `generic "Trending Gadgets & Appliances"` |
| Top Value Deals | `generic "Top Value Deals"` |
| Grab or gone | `generic "Grab or gone"` |
| Make your home stylish | `generic "Make your home stylish"` |
| Brands in Spotlight | `generic "Brands in Spotlight"` |

---

## Appendix B: Test Data

### Valid Search Terms
- "phone"
- "laptop"
- "shoes"
- "samsung"
- "nike"

### Invalid Search Terms
- "!@#$%^&*"
- "" (empty)
- "a".repeat(100) (very long)
- "<script>alert('xss')</script>" (XSS attempt)

### Expected Deal Cards (Grab or Gone)
| Card Title | Badge | Discount |
|------------|-------|----------|
| Top Sellers | - | Min. 70% Off |
| Grab Or Gone | Top Rated | - |
| In Focus Now | - | Min. 70% Off |
| Widest Range | Special offer | - |

### Expected Trend Cards
- HealthyCooking
- Korean
- Tassel
- Court Sneakers

### Expected Gadgets Categories
- True Wireless (Min. 50% Off)
- Neckband (Min. 50% Off)
- Smart Watches (Min. 40% Off)
- Mobile Speakers (Special offer)

### Expected Home Categories
- Mop Set (Top Sellers)
- Water Bottles & Flasks (Special offer)
- Choppers & Slicers (Min. 50% Off)
- Pressure Cookers (Special offer)

---

## Appendix C: Test Scenarios Count Summary

| Category | Positive | Negative | Total |
|----------|----------|----------|-------|
| Header Section | 23 | 4 | 27 |
| Navigation Tab Bar | 24 | 0 | 24 |
| Hero Banner Carousel | 10 | 3 | 13 |
| Trends You May Like | 8 | 0 | 8 |
| Trending Gadgets & Appliances | 9 | 0 | 9 |
| Top Value Deals | 9 | 2 | 11 |
| Grab or Gone | 13 | 0 | 13 |
| Make Your Home Stylish | 9 | 0 | 9 |
| Brands in Spotlight | 6 | 0 | 6 |
| Footer Section | 56 | 0 | 56 |
| Cross-Cutting Concerns | 25 | 8 | 33 |
| **TOTAL** | **192** | **17** | **209** |
