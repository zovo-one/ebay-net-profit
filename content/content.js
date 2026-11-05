"use strict";(()=>{var PRICE_INPUT_SELECTORS=['[data-testid="price-input"]','input[aria-label="Price"]','input[aria-label="Price (US $)"]','input[name="price"]','input[placeholder*="Price" i]','input[type="number"][id*="price" i]'],CATEGORY_SELECTORS=['[data-testid="category-select"]','select[aria-label="Category"]','select[name*="category" i]','div[role="combobox"][aria-label*="Category" i]'],SELL_FORM_CONTAINER_SELECTORS=['[data-testid="pricing-section"]','section[aria-label*="Pricing" i]','div[class*="PricingSection" i]','form[name="sellForm"]'],SELL_FORM_URL_PATTERNS=[/^https?:\/\/[^/]*ebay\.com\/sl\/(?:sell|list)/i,/^https?:\/\/[^/]*ebay\.com\/sch\/[^/]+\/sell/i,/^https?:\/\/[^/]*ebay\.com\/itm\/.*(?:sell|edit)/i,/^https?:\/\/[^/]*ebay\.com\/sl\/listing/i],ACTIVE_LISTINGS_TABLE_BODY_SELECTORS=['table[data-testid="active-listings-table"] tbody','div[role="grid"][aria-label*="Active" i]','table[class*="activeListings" i] tbody','tbody[class*="listings-body" i]'],ACTIVE_LISTINGS_HEADER_ROW_SELECTORS=['table[data-testid="active-listings-table"] thead tr','div[role="row"][aria-rowindex="1"]','tr[class*="header-row" i]'],ROW_PRICE_CELL_SELECTORS=['td[data-testid="row-price"]','td[aria-label*="Price" i]','td[class*="priceCell" i]'],ROW_LISTING_ID_HINTS=["[data-listingid]",'a[href*="itm="]','a[href*="/itm/"]'],SELLER_HUB_URL_PATTERNS=[/^https?:\/\/[^/]*ebay\.com\/sh\/lings/i,/^https?:\/\/[^/]*ebay\.com\/sh\/active/i,/^https?:\/\/[^/]*ebay\.com\/sh\/listing/i];function firstMatchingSelector(selectors,root=document){for(let sel of selectors)try{let el=root.querySelector(sel);if(el)return el}catch{}return null}var LOGIN_WALL_PATTERNS=[/\/signin\//i,/\/login\//i,/^https?:\/\/signin\.ebay\.com\//i];function isLoginWall(url){return LOGIN_WALL_PATTERNS.some(re=>re.test(url))}function detectPage(url=location.href){try{return isLoginWall(url)?"other":SELLER_HUB_URL_PATTERNS.some(re=>re.test(url))?document.querySelector('[data-testid="login-wall"]')||document.querySelector('[class*="SignIn" i]')?"other":"seller-hub":SELL_FORM_URL_PATTERNS.some(re=>re.test(url))?"sell-form":"other"}catch{return"other"}}function normalizeKey(name){return String(name??"").trim().toLowerCase()}function lookupCategory(table,rawName){let key=normalizeKey(rawName);if(key.length===0)return{canonical:null,entry:null};for(let canonical of Object.keys(table.categories))if(normalizeKey(canonical)===key){let entry=table.categories[canonical];if(entry)return{canonical,entry}}let aliases=table.aliases??{};for(let alias of Object.keys(aliases))if(normalizeKey(alias)===key){let target=aliases[alias];if(!target)continue;let entry=table.categories[target];if(entry)return{canonical:target,entry}}return{canonical:null,entry:null}}function resolveOverride(canonical,rawName,overrides){if(!overrides)return;let canonicalKey=canonical?normalizeKey(canonical):"",rawKey=normalizeKey(rawName);if(canonicalKey){for(let k of Object.keys(overrides))if(normalizeKey(k)===canonicalKey){let v=overrides[k];if(typeof v=="number"&&Number.isFinite(v)&&v>=0&&v<=1)return v}}if(rawKey){for(let k of Object.keys(overrides))if(normalizeKey(k)===rawKey){let v=overrides[k];if(typeof v=="number"&&Number.isFinite(v)&&v>=0&&v<=1)return v}}}function computePerOrderFee(salePrice,table){try{for(let tier of table.per_order_fee.tiered)if("max_sale_price"in tier&&salePrice<=tier.max_sale_price||"min_sale_price_gt"in tier&&salePrice>tier.min_sale_price_gt)return tier.fee}catch{}return salePrice<=10?.3:.4}function computeEffectiveRate(categoryRate,storeTierImmune,storeTier){return storeTierImmune?categoryRate:storeTier==="starter"?.136:storeTier==="basicPlus"?.127:categoryRate}function computeProfit(input,table){let salePrice=Number.isFinite(input.salePrice)?input.salePrice:0,itemCost=Number.isFinite(input.itemCost)?input.itemCost:0,shippingCost=Number.isFinite(input.shippingCost)?input.shippingCost:0,{canonical,entry}=lookupCategory(table,input.categoryName),override=resolveOverride(canonical,input.categoryName,input.categoryOverrides),categoryRate,storeTierImmune,assumptionFlag="none",assumedStandardRate=!1,resolvedCategoryName;if(override!==void 0)categoryRate=override,storeTierImmune=entry?.storeTierImmune??!1,assumptionFlag="pro-override-applied",resolvedCategoryName=canonical??input.categoryName.trim();else if(entry){categoryRate=entry.rate,storeTierImmune=entry.storeTierImmune,resolvedCategoryName=canonical??input.categoryName.trim();let normalizedInput=normalizeKey(input.categoryName);canonical&&normalizedInput!==normalizeKey(canonical)&&(assumptionFlag="category-alias-resolved")}else categoryRate=table.standard_rate_if_unknown,storeTierImmune=!1,assumedStandardRate=!0,assumptionFlag="category-unknown-standard-13.25",resolvedCategoryName=input.categoryName.trim();let effectiveRate=computeEffectiveRate(categoryRate,storeTierImmune,input.storeTier),perOrderFee=computePerOrderFee(salePrice,table),intlRate=table.international_fee?.rate??.0165,intlFee=input.intlOn?salePrice*intlRate:0,finalValueFee=salePrice*effectiveRate,ebayTotalFee=finalValueFee+perOrderFee+intlFee,grossRevenue=salePrice,netProfit=salePrice-itemCost-shippingCost-ebayTotalFee,margin=salePrice>0?netProfit/salePrice:0;return{salePrice,itemCost,shippingCost,effectiveRate,categoryRate,storeTierImmune,storeTier:input.storeTier,perOrderFee,intlFee,ebayTotalFee,grossRevenue,netProfit,margin,assumedStandardRate,assumptionFlag,resolvedCategoryName,breakdown:{finalValueFee,perOrderFee,intlFee}}}var ebay_categories_2026_default={version:"2026-07",source:"eBay US 2026 final-value-fee schedule (Standard/Store tier bands). Specialty categories carry storeTierImmune:true \u2014 they keep their rate regardless of Store subscription.",standard_rate_if_unknown:.1325,categories:{Antiques:{rate:.06,storeTierImmune:!1},Art:{rate:.1,storeTierImmune:!1},Baby:{rate:.1325,storeTierImmune:!1},"Books, Comics & Magazines":{rate:.1255,storeTierImmune:!1},"Business & Industrial":{rate:.1,storeTierImmune:!1},"Cameras & Photo":{rate:.06,storeTierImmune:!0},"Cell Phones & Accessories":{rate:.1325,storeTierImmune:!1},"Clothing, Shoes & Accessories":{rate:.1325,storeTierImmune:!1},"Coins & Paper Money":{rate:.125,storeTierImmune:!1},Collectibles:{rate:.1325,storeTierImmune:!1},"Computers/Tablets & Networking":{rate:.06,storeTierImmune:!0},Crafts:{rate:.1325,storeTierImmune:!1},"Dolls & Bears":{rate:.1325,storeTierImmune:!1},Electronics:{rate:.1325,storeTierImmune:!1},"Entertainment Memorabilia":{rate:.1,storeTierImmune:!1},"Gift Cards":{rate:.12,storeTierImmune:!1},"Health & Beauty":{rate:.1,storeTierImmune:!1},"Heavy/Bulky (50-150 lbs)":{rate:.1255,storeTierImmune:!1},"Home & Garden":{rate:.1325,storeTierImmune:!1},"Jewelry & Watches":{rate:.1325,storeTierImmune:!1},"Motors Parts & Accessories":{rate:.1255,storeTierImmune:!1},Music:{rate:.1255,storeTierImmune:!1},"Musical Instruments & Gear":{rate:.08,storeTierImmune:!1},"Pet Supplies":{rate:.1325,storeTierImmune:!1},"Pottery & Glass":{rate:.1325,storeTierImmune:!1},"Real Estate":{rate:.005,storeTierImmune:!0},"Sporting Goods":{rate:.1325,storeTierImmune:!1},"Sports Mem, Cards & Fan Shop":{rate:.1,storeTierImmune:!1},Stamps:{rate:.125,storeTierImmune:!1},"Tickets & Experiences":{rate:.1,storeTierImmune:!1},"Toys & Hobbies":{rate:.1325,storeTierImmune:!1},Travel:{rate:.1,storeTierImmune:!1},"Video Games & Consoles":{rate:.1325,storeTierImmune:!1},"Everything Else":{rate:.1325,storeTierImmune:!1}},aliases:{Computers:"Computers/Tablets & Networking",Computer:"Computers/Tablets & Networking","Computers & Networking":"Computers/Tablets & Networking",Cameras:"Cameras & Photo",Camera:"Cameras & Photo","Camera & Photo":"Cameras & Photo",Photo:"Cameras & Photo","Musical Instruments":"Musical Instruments & Gear","Musical Instruments (Guitars)":"Musical Instruments & Gear",Guitars:"Musical Instruments & Gear","Health and Beauty":"Health & Beauty",Beauty:"Health & Beauty","Heavy Equipment":"Heavy/Bulky (50-150 lbs)","Heavy/Bulky":"Heavy/Bulky (50-150 lbs)",Motors:"Motors Parts & Accessories","eBay Motors Parts & Accessories":"Motors Parts & Accessories","Parts & Accessories":"Motors Parts & Accessories","Gift Cards & Coupons":"Gift Cards","Most categories":"Everything Else"},store_tier_rates:{none:{explanation:"Use the category rate from the categories table."},starter:{rate_override_standard_band:.136},basicPlus:{rate_override_standard_band:.127}},per_order_fee:{tiered:[{max_sale_price:10,fee:.3},{min_sale_price_gt:10,fee:.4}]},international_fee:{rate:.0165}};var KEYS={defaultCost:"ebay_net_profit_default_cost",defaultShipping:"ebay_net_profit_default_shipping",storeTier:"ebay_net_profit_store_tier",intl:"ebay_net_profit_intl",showColumn:"ebay_net_profit_show_column",showDelta:"ebay_net_profit_show_delta",editsToday:"ebay_net_profit_edits_today",editsResetAt:"ebay_net_profit_edits_reset_at",overrides:"ebay_net_profit_overrides",categoryOverrides:"ebay_net_profit_category_overrides",profiles:"ebay_net_profit_profiles",proStatus:"ebay_net_profit_pro_status",proKey:"ebay_net_profit_pro_key",proVerifiedAt:"ebay_net_profit_pro_verified_at",proExp:"ebay_net_profit_pro_exp",funnelEvents:"ebay_net_profit_funnel_events",seenOnboarding:"ebay_net_profit_seen_onboarding"},DEFAULTS={defaultCost:0,defaultShipping:0,storeTier:"none",intl:!1,showColumn:!0,showDelta:!1,editsToday:0,editsResetAt:new Date(0).toISOString(),overrides:{},categoryOverrides:{},profiles:[],proStatus:"free",proKey:null,proVerifiedAt:0,proExp:0,funnelEvents:[],seenOnboarding:!1};async function readRaw(key,fallback,validate){try{let v=(await chrome.storage.local.get(key))[key];return validate(v)?v:fallback}catch{return fallback}}async function writeRaw(key,value){try{await chrome.storage.local.set({[key]:value})}catch(err){console.warn("[ebay-net-profit] storage write failed:",key,err)}}function isNumber(v){return typeof v=="number"&&Number.isFinite(v)}function isBoolean(v){return typeof v=="boolean"}function isString(v){return typeof v=="string"&&v.length>0}function isStoreTier(v){return v==="none"||v==="starter"||v==="basicPlus"}function isListingOverride(v){if(typeof v!="object"||v===null)return!1;let o=v;return isNumber(o.cost)&&isNumber(o.shipping)}function isOverridesMap(v){if(typeof v!="object"||v===null)return!1;for(let k of Object.keys(v))if(!isListingOverride(v[k]))return!1;return!0}function isCategoryOverrides(v){if(typeof v!="object"||v===null)return!1;for(let k of Object.keys(v)){let val=v[k];if(!isNumber(val)||val<0||val>1)return!1}return!0}var getDefaultCost=()=>readRaw(KEYS.defaultCost,DEFAULTS.defaultCost,isNumber),setDefaultCost=v=>writeRaw(KEYS.defaultCost,v),getDefaultShipping=()=>readRaw(KEYS.defaultShipping,DEFAULTS.defaultShipping,isNumber),setDefaultShipping=v=>writeRaw(KEYS.defaultShipping,v),getStoreTier=()=>readRaw(KEYS.storeTier,DEFAULTS.storeTier,isStoreTier),setStoreTier=v=>writeRaw(KEYS.storeTier,v),getIntl=()=>readRaw(KEYS.intl,DEFAULTS.intl,isBoolean),setIntl=v=>writeRaw(KEYS.intl,v),getShowColumn=()=>readRaw(KEYS.showColumn,DEFAULTS.showColumn,isBoolean);var getShowDelta=()=>readRaw(KEYS.showDelta,DEFAULTS.showDelta,isBoolean);var setEditsToday=v=>writeRaw(KEYS.editsToday,v),getEditsResetAt=()=>readRaw(KEYS.editsResetAt,DEFAULTS.editsResetAt,isString),setEditsResetAt=v=>writeRaw(KEYS.editsResetAt,v),getOverrides=()=>readRaw(KEYS.overrides,DEFAULTS.overrides,isOverridesMap),setOverrides=v=>writeRaw(KEYS.overrides,v),getCategoryOverrides=()=>readRaw(KEYS.categoryOverrides,DEFAULTS.categoryOverrides,isCategoryOverrides);async function getListingOverride(listingId){return(await getOverrides())[listingId]}async function setListingOverride(listingId,override){let all=await getOverrides();all[listingId]=override,await setOverrides(all)}var FUNNEL_EVENTS_KEY="ebay_net_profit_funnel_events";function logFunnelEvent(event){event.ts||(event.ts=nowIso());try{chrome.storage.local.get(FUNNEL_EVENTS_KEY,bag=>{try{let stored=bag?.[FUNNEL_EVENTS_KEY],clean=(Array.isArray(stored)?stored:[]).filter(e=>typeof e=="object"&&e!==null&&typeof e.type=="string");clean.push(event);let start=clean.length>100?clean.length-100:0,trimmed=start>0?clean.slice(start):clean;chrome.storage.local.set({[FUNNEL_EVENTS_KEY]:trimmed},()=>{chrome.runtime.lastError&&console.warn("[ebay-net-profit] funnel: storage.local.set error:",chrome.runtime.lastError.message)})}catch(err){console.warn("[ebay-net-profit] funnel: inner append failed:",err)}})}catch(err){console.warn("[ebay-net-profit] funnel: storage.local.get failed:",err)}}function nowIso(){try{return new Date().toISOString()}catch{return"1970-01-01T00:00:00.000Z"}}function emit(name,detail){try{let surface=typeof detail?.surface=="string"?detail.surface:void 0;switch(name){case"cta_click":logFunnelEvent({type:"cta-click",ts:"",surface});return;case"paywall_shown":logFunnelEvent({type:"paywall-view",ts:"",surface});return;case"cap_hit":logFunnelEvent({type:"cap-hit",ts:"",surface});return;case"first_value":logFunnelEvent({type:"first-value",ts:"",surface});return;default:console.warn("[ebay-net-profit] funnel: emit() received unknown name:",name)}}catch(err){console.warn("[ebay-net-profit] funnel: emit() failed:",err)}}function applyI18n(root=document){try{root.querySelectorAll("[data-i18n]").forEach(el=>{let key=el.dataset.i18n;if(!key)return;let msg=chrome.i18n.getMessage(key);msg&&(el.textContent=msg)}),root.querySelectorAll("[data-i18n-attr]").forEach(el=>{let raw=el.dataset.i18nAttr;if(!raw)return;let pairs=raw.split(";");for(let p of pairs){let[attr,key]=p.split(":").map(s=>s.trim());if(!attr||!key)continue;let msg=chrome.i18n.getMessage(key);msg&&(attr==="placeholder"?el.placeholder=msg:attr==="aria-label"?el.setAttribute("aria-label",msg):attr==="title"?el.title=msg:attr==="href"&&(/^https?:\/\//i.test(msg)||/^mailto:/i.test(msg))&&(el.href=msg))}})}catch(err){console.warn("[ebay-net-profit] applyI18n failed:",err)}}function getMessage(key,fallback){try{return chrome.i18n.getMessage(key)||fallback||""}catch{return fallback||""}}var CATEGORIES_TABLE=ebay_categories_2026_default;function waitForElement(selectors,timeoutMs,intervalMs){return new Promise((resolve,reject)=>{let start=Date.now(),probe=()=>{let el=firstMatchingSelector(selectors);if(el){resolve(el);return}if(Date.now()-start>=timeoutMs){reject(new Error("SellFormNotFound"));return}setTimeout(probe,intervalMs)};probe()})}var PROFIT_FORMATTER=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}),PERCENT_FORMATTER=new Intl.NumberFormat("en-US",{style:"percent",minimumFractionDigits:1,maximumFractionDigits:1});function toneForResult(r){return r.netProfit<0?"red":r.netProfit===0?"amber":r.margin>=.25?"green":r.margin>=.1?"amber":"red"}function formatProfit(r){let sign=r.netProfit<0?"\u2212":"+",abs=PROFIT_FORMATTER.format(Math.abs(r.netProfit)),marginPct=PERCENT_FORMATTER.format(r.margin),labelKey=r.netProfit<0?"badgeLoss":"badgeProfit",label=getMessage(labelKey,r.netProfit<0?"loss":"profit"),parts=[`${sign}${abs} ${label}`,`(${marginPct})`];return r.assumedStandardRate&&parts.push(getMessage("badgeAssumption","category unknown")),parts.join(" ")}function formatCategoryLine(r){let name=r.resolvedCategoryName||getMessage("badgeCategoryUnknown","Unknown"),rate=PERCENT_FORMATTER.format(r.categoryRate);return r.assumedStandardRate?getMessage("badgeCategoryUnknownLine","Standard 13.25% used. Pick a category on the form for an exact rate."):getMessage("badgeCategoryLine","$NAME \xB7 fee $RATE").replace("$NAME",name).replace("$RATE",rate)}var HOST_ATTR="data-enp-surface-a",HOST_ATTR_VALUE="mounted";function buildPanel(priceInput){let existing=document.querySelector(`[${HOST_ATTR}="${HOST_ATTR_VALUE}"]`);if(existing&&existing.shadowRoot)return{host:existing,shadow:existing.shadowRoot};let host=document.createElement("div");host.setAttribute(HOST_ATTR,HOST_ATTR_VALUE),host.style.all="initial",host.style.display="block",host.style.marginTop="8px";let shadow=host.attachShadow({mode:"closed"}),container=priceInput.closest(SELL_FORM_CONTAINER_SELECTORS.join(","))||priceInput.parentElement;return container?container.insertAdjacentElement("afterend",host):priceInput.insertAdjacentElement("afterend",host),{host,shadow}}function renderShell(shadow){shadow.innerHTML=`
<style>
  :host, .enp-panel {
    all: initial;
    font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 14px;
    color: #111827;
    box-sizing: border-box;
  }
  .enp-panel {
    background: #FFFFFF;
    color: #111827;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 12px;
    margin-top: 8px;
    max-width: 360px;
    display: block;
  }
  @media (prefers-color-scheme: dark) {
    .enp-panel { background: #1F1F2E; color: #F9FAFB; border-color: #374151; }
  }
  :root[data-theme="dark"] .enp-panel {
    background: #1F1F2E; color: #F9FAFB; border-color: #374151;
  }
  .enp-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
  .enp-row label { flex: 0 0 100px; font-size: 13px; }
  .enp-row input[type="number"] {
    flex: 1 1 auto; min-width: 80px;
    padding: 4px 8px; font-size: 14px;
    border: 1px solid #D1D5DB; border-radius: 4px;
    background: #FFFFFF; color: #111827;
  }
  @media (prefers-color-scheme: dark) {
    .enp-row input[type="number"] { background: #111827; color: #F9FAFB; border-color: #4B5563; }
  }
  :root[data-theme="dark"] .enp-row input[type="number"] {
    background: #111827; color: #F9FAFB; border-color: #4B5563;
  }
  .enp-tier { display: inline-flex; border: 1px solid #D1D5DB; border-radius: 4px; overflow: hidden; }
  .enp-tier button {
    border: 0; background: #F9FAFB; color: #111827;
    padding: 4px 10px; font-size: 12px; cursor: pointer;
  }
  .enp-tier button[aria-pressed="true"] {
    background: #6C5CE7; color: #FFFFFF;
  }
  @media (prefers-color-scheme: dark) {
    .enp-tier button { background: #1F1F2E; color: #F9FAFB; }
    .enp-tier button[aria-pressed="true"] { background: #8B7CF0; color: #FFFFFF; }
  }
  :root[data-theme="dark"] .enp-tier button { background: #1F1F2E; color: #F9FAFB; }
  :root[data-theme="dark"] .enp-tier button[aria-pressed="true"] { background: #8B7CF0; color: #FFFFFF; }
  .enp-badge {
    display: inline-block; padding: 6px 10px; border-radius: 999px;
    font-weight: 600; font-size: 14px; margin-top: 8px;
    background: #F3F4F6; color: #111827;
    min-width: 200px;
  }
  .enp-badge.tone-green { background: #ECFDF5; color: #065F46; border: 1px solid #10B981; }
  .enp-badge.tone-amber { background: #FFFBEB; color: #92400E; border: 1px solid #B45309; }
  .enp-badge.tone-red   { background: #FEF2F2; color: #991B1B; border: 1px solid #DC2626; }
  @media (prefers-color-scheme: dark) {
    .enp-badge { background: #1F1F2E; color: #F9FAFB; }
    .enp-badge.tone-green { background: #064E3B; color: #D1FAE5; border-color: #34D399; }
    .enp-badge.tone-amber { background: #451A03; color: #FDE68A; border-color: #FCD34D; }
    .enp-badge.tone-red   { background: #450A0A; color: #FECACA; border-color: #F87171; }
  }
  :root[data-theme="dark"] .enp-badge { background: #1F1F2E; color: #F9FAFB; }
  :root[data-theme="dark"] .enp-badge.tone-green { background: #064E3B; color: #D1FAE5; border-color: #34D399; }
  :root[data-theme="dark"] .enp-badge.tone-amber { background: #451A03; color: #FDE68A; border-color: #FCD34D; }
  :root[data-theme="dark"] .enp-badge.tone-red   { background: #450A0A; color: #FECACA; border-color: #F87171; }
  .enp-cat { font-size: 12px; color: #6B7280; margin-top: 6px; }
  @media (prefers-color-scheme: dark) { .enp-cat { color: #9CA3AF; } }
  :root[data-theme="dark"] .enp-cat { color: #9CA3AF; }
  .enp-intl { display: flex; align-items: center; gap: 4px; font-size: 12px; }
  .enp-divider { border-top: 1px solid #E5E7EB; margin: 8px 0; }
  @media (prefers-color-scheme: dark) { .enp-divider { border-color: #374151; } }
  :root[data-theme="dark"] .enp-divider { border-color: #374151; }
</style>

<div class="enp-panel" role="group" aria-label="Net Profit seller tools">
  <div class="enp-row">
    <label for="enp-cost" data-i18n="panelCost">Item cost ($)</label>
    <input id="enp-cost" type="number" min="0" step="0.01" />
  </div>
  <div class="enp-row">
    <label for="enp-shipping" data-i18n="panelShipping">Shipping cost ($)</label>
    <input id="enp-shipping" type="number" min="0" step="0.01" />
  </div>
  <div class="enp-row">
    <span class="enp-tier" role="group" aria-label="Store tier">
      <button type="button" data-tier="none" aria-pressed="false" data-i18n="tierNone">No Store</button>
      <button type="button" data-tier="starter" aria-pressed="false" data-i18n="tierStarter">Starter</button>
      <button type="button" data-tier="basicPlus" aria-pressed="false" data-i18n="tierBasicPlus">Basic+</button>
    </span>
  </div>
  <div class="enp-row">
    <label class="enp-intl">
      <input id="enp-intl" type="checkbox" />
      <span data-i18n="panelIntl">Buyer outside the US (+1.65%)</span>
    </label>
  </div>
  <div class="enp-divider"></div>
  <div class="enp-badge" id="enp-badge" role="status" aria-live="polite">$0.00</div>
  <div class="enp-cat" id="enp-category"></div>
</div>
  `.trim(),applyI18n(shadow);let costInput=shadow.querySelector("#enp-cost"),shippingInput=shadow.querySelector("#enp-shipping"),tierSegmented=shadow.querySelector(".enp-tier"),tierButtons=Array.from(tierSegmented.querySelectorAll("button[data-tier]")),intlCheckbox=shadow.querySelector("#enp-intl"),badgeRoot=shadow.querySelector("#enp-badge"),categoryRoot=shadow.querySelector("#enp-category");return{costInput,shippingInput,tierSegmented,tierButtons,intlCheckbox,badgeRoot,categoryRoot}}function readCategoryFromPage(){let sel=firstMatchingSelector(CATEGORY_SELECTORS);if(!sel)return"";if(sel instanceof HTMLSelectElement){let v=sel.value?.trim();return v||(sel.options.item(sel.selectedIndex)?.textContent?.trim()??"")}return(sel.getAttribute("aria-label")||sel.textContent||"").trim()}function readPriceFromPage(priceInput){if(priceInput instanceof HTMLInputElement){let n2=Number(priceInput.value);return Number.isFinite(n2)?n2:0}if(priceInput instanceof HTMLSelectElement){let n2=Number(priceInput.value);return Number.isFinite(n2)?n2:0}let t=(priceInput.textContent||"").replace(/[^0-9.]/g,""),n=Number(t);return Number.isFinite(n)?n:0}function setTierButtons(tierButtons,tier){for(let b of tierButtons){let active=b.dataset.tier===tier;b.setAttribute("aria-pressed",active?"true":"false")}}var firstValueEmitted=!1;async function mountSurfaceA(){let priceInput;try{priceInput=await waitForElement(PRICE_INPUT_SELECTORS,5e3,250)}catch{return surfaceFailedToast(),!1}let inputEl=priceInput,{shadow}=buildPanel(inputEl),{costInput,shippingInput,tierButtons,intlCheckbox,badgeRoot,categoryRoot}=renderShell(shadow),[defaultCost,defaultShipping,storeTier,intl]=await Promise.all([getDefaultCost(),getDefaultShipping(),getStoreTier(),getIntl()]);costInput.value=defaultCost>0?String(defaultCost):"",shippingInput.value=defaultShipping>0?String(defaultShipping):"",intlCheckbox.checked=!!intl,setTierButtons(tierButtons,storeTier);async function recompute(){let salePrice=readPriceFromPage(inputEl),itemCost=Number(costInput.value)||0,shippingCost=Number(shippingInput.value)||0,tier=tierButtons.find(b=>b.getAttribute("aria-pressed")==="true")?.dataset.tier==="starter"?"starter":tierButtons.find(b=>b.getAttribute("aria-pressed")==="true")?.dataset.tier==="basicPlus"?"basicPlus":"none",intlOn=!!intlCheckbox.checked,categoryName=readCategoryFromPage(),categoryOverrides=await getCategoryOverrides(),result=computeProfit({salePrice,itemCost,shippingCost,storeTier:tier,intlOn,categoryName,categoryOverrides},CATEGORIES_TABLE);badgeRoot.textContent=formatProfit(result),badgeRoot.classList.remove("tone-green","tone-amber","tone-red"),badgeRoot.classList.add(`tone-${toneForResult(result)}`),categoryRoot.textContent=formatCategoryLine(result),!firstValueEmitted&&salePrice>0&&(firstValueEmitted=!0,logFunnelEvent({type:"first-value",ts:""}))}inputEl.addEventListener("input",recompute),costInput.addEventListener("input",async()=>{let v=Number(costInput.value)||0;await setDefaultCost(v),await recompute()}),shippingInput.addEventListener("input",async()=>{let v=Number(shippingInput.value)||0;await setDefaultShipping(v),await recompute()}),intlCheckbox.addEventListener("change",async()=>{await setIntl(!!intlCheckbox.checked),await recompute()});for(let b of tierButtons)b.addEventListener("click",async()=>{let tier=b.dataset.tier||"none";setTierButtons(tierButtons,tier),await setStoreTier(tier),await recompute()});let catEl=firstMatchingSelector(CATEGORY_SELECTORS);return catEl&&catEl.addEventListener("change",recompute),await recompute(),!0}var toastShown=!1;function surfaceFailedToast(){if(!toastShown){toastShown=!0;try{let host=document.createElement("div");host.style.all="initial",host.style.position="fixed",host.style.right="16px",host.style.bottom="16px",host.style.zIndex="2147483647";let shadow=host.attachShadow({mode:"closed"});shadow.innerHTML=`
<style>
  .toast {
    font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #1F1F2E; color: #F9FAFB; padding: 12px 16px;
    border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.18);
    font-size: 13px; max-width: 320px;
  }
  .toast a { color: #8B7CF0; }
</style>
<div class="toast" role="alert">
  <div data-i18n="failToast">Could not find the sell form. eBay may have changed their page. Email support@zovo.one and I will fix it.</div>
  <div style="margin-top:6px;"><a href="mailto:support@zovo.one">support@zovo.one</a></div>
</div>
    `.trim(),document.body.appendChild(host),setTimeout(()=>{try{host.remove()}catch{}},12e3)}catch(err){console.warn("[ebay-net-profit] fail toast render failed:",err)}}}var EXTENSION_SLUG="ebay-net-profit";var SUPPORT_EMAIL="support@zovo.one",SUPPORT_MAILTO_URL=`mailto:${SUPPORT_EMAIL}`;var LICENSE_OFFLINE_GRACE_MS=7*24*60*60*1e3;function PRICING_URL(surface){let u=new URL("https://zovo.one/pricing");return u.searchParams.set("utm_source",EXTENSION_SLUG),u.searchParams.set("utm_medium","extension"),u.searchParams.set("utm_campaign","upgrade"),u.searchParams.set("utm_content",surface),u.toString()}var CATEGORIES_TABLE2=ebay_categories_2026_default,COLUMN_HEADER_ATTR="data-enp-col",ROW_CELL_ATTR="data-enp-row-id",DEBOUNCE_MS=150;function waitForElement2(selectors,timeoutMs,intervalMs){return new Promise((resolve,reject)=>{let start=Date.now(),probe=()=>{let el=firstMatchingSelector(selectors);if(el){resolve(el);return}if(Date.now()-start>=timeoutMs){reject(new Error("SellerHubTableNotFound"));return}setTimeout(probe,intervalMs)};probe()})}var ITM_EQ_RE=/itm=(\d+)/,ITM_SLASH_RE=/\/itm\/(\d+)/;function extractListingId(row){let hint=firstMatchingSelector(ROW_LISTING_ID_HINTS,row);if(hint){let dataId=hint.getAttribute("data-listingid");if(dataId&&/^\d+$/.test(dataId))return{id:dataId,fallback:!1};let anchor=hint;if(anchor.href){let m=ITM_EQ_RE.exec(anchor.href)||ITM_SLASH_RE.exec(anchor.href);if(m&&m[1])return{id:m[1],fallback:!1}}}let anchors=row.querySelectorAll('a[href*="itm="], a[href*="/itm/"]');for(let a of anchors){let m=ITM_EQ_RE.exec(a.href)||ITM_SLASH_RE.exec(a.href);if(m&&m[1])return{id:m[1],fallback:!1}}let firstText=(row.cells[0]?.textContent||"").trim().slice(0,40);return{id:`fallback-${row.rowIndex}-${firstText}`,fallback:!0}}function parsePrice(text){let cleaned=(text||"").replace(/[^0-9.]/g,""),n=Number(cleaned);return Number.isFinite(n)?n:0}function extractRowPrice(row){let cell=firstMatchingSelector(ROW_PRICE_CELL_SELECTORS,row);if(cell)return parsePrice(cell.textContent||"");for(let i=0;i<row.cells.length;i++){let c=row.cells[i];if(!c)continue;let t=c.textContent||"";if(/\$\s*\d/.test(t))return parsePrice(t)}return 0}var PROFIT_FMT=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}),PERCENT_FMT=new Intl.NumberFormat("en-US",{style:"percent",minimumFractionDigits:1,maximumFractionDigits:1});function toneForResult2(r){return r.netProfit<0?"red":r.netProfit===0?"amber":r.margin>=.25?"green":r.margin>=.1?"amber":"red"}function formatCellText(r){let sign=r.netProfit<0?"\u2212":"+",abs=PROFIT_FMT.format(Math.abs(r.netProfit)),pct=PERCENT_FMT.format(r.margin);return`${sign}${abs} (${pct})`}function ensureHeader(){let headerRow=firstMatchingSelector(ACTIVE_LISTINGS_HEADER_ROW_SELECTORS);if(!headerRow||headerRow.querySelector(`th[${COLUMN_HEADER_ATTR}]`))return;let th=document.createElement("th");th.setAttribute(COLUMN_HEADER_ATTR,"net-profit"),th.setAttribute("scope","col"),th.textContent=getMessage("columnHeader","Net Profit"),th.style.fontSize="12px",th.style.fontWeight="600",th.style.padding="8px",th.style.whiteSpace="nowrap",headerRow.appendChild(th)}function buildCellHost(listingId){let td=document.createElement("td");return td.setAttribute(ROW_CELL_ATTR,listingId),td.style.verticalAlign="middle",td.style.padding="8px",td.style.whiteSpace="nowrap",td}function renderCellContent(td,result,showDelta){let existingHost=td.querySelector("div[data-enp-cell-host]"),host=existingHost||document.createElement("div");host.setAttribute("data-enp-cell-host","1"),host.style.all="initial",host.style.cursor="pointer",host.style.display="inline-block",existingHost||td.appendChild(host);let shadow=host.shadowRoot;shadow||(shadow=host.attachShadow({mode:"closed"}));let tone=toneForResult2(result),profitText=formatCellText(result),deltaText=showDelta?getMessage("cellFee","eBay fee")+" "+PROFIT_FMT.format(result.ebayTotalFee):"";shadow.innerHTML=`
<style>
  :host, .cell {
    all: initial;
    font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 13px;
    display: inline-block;
  }
  .cell {
    padding: 4px 8px; border-radius: 999px; cursor: pointer;
    background: #F3F4F6; color: #111827;
    border: 1px solid transparent;
  }
  .cell.tone-green { background: #ECFDF5; color: #065F46; border-color: #10B981; }
  .cell.tone-amber { background: #FFFBEB; color: #92400E; border-color: #B45309; }
  .cell.tone-red   { background: #FEF2F2; color: #991B1B; border-color: #DC2626; }
  .delta { display: block; font-size: 11px; opacity: 0.85; margin-top: 2px; }
  @media (prefers-color-scheme: dark) {
    .cell { background: #1F1F2E; color: #F9FAFB; }
    .cell.tone-green { background: #064E3B; color: #D1FAE5; border-color: #34D399; }
    .cell.tone-amber { background: #451A03; color: #FDE68A; border-color: #FCD34D; }
    .cell.tone-red   { background: #450A0A; color: #FECACA; border-color: #F87171; }
  }
</style>
<div class="cell tone-${tone}" role="button" tabindex="0" aria-label="${escapeHtml(profitText)}">
  <span class="profit">${escapeHtml(profitText)}</span>
  ${deltaText?`<span class="delta">${escapeHtml(deltaText)}</span>`:""}
</div>
  `.trim()}function escapeHtml(s){return s.replace(/[&<>"']/g,c=>{switch(c){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";default:return"&#39;"}})}async function openInlineEditor(listingId,row,current,recompute){let td=row.querySelector(`td[${ROW_CELL_ATTR}="${cssEscape(listingId)}"]`);if(!td||td.querySelector("div[data-enp-editor-host]"))return;let host=document.createElement("div");host.setAttribute("data-enp-editor-host","1"),host.style.all="initial",host.style.display="block";let shadow=host.attachShadow({mode:"closed"});shadow.innerHTML=`
<style>
  :host, .ed { all: initial; font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 13px; }
  .ed { display: inline-block; padding: 8px; background: #FFFFFF; color: #111827;
        border: 1px solid #D1D5DB; border-radius: 6px; min-width: 220px; }
  @media (prefers-color-scheme: dark) { .ed { background: #1F1F2E; color: #F9FAFB; border-color: #4B5563; } }
  .ed label { display: block; font-size: 11px; margin-top: 6px; }
  .ed input { display: block; width: 100%; padding: 4px; font-size: 13px;
              border: 1px solid #D1D5DB; border-radius: 4px; background: #FFFFFF; color: #111827; box-sizing: border-box; }
  @media (prefers-color-scheme: dark) { .ed input { background: #111827; color: #F9FAFB; border-color: #4B5563; } }
  .ed .actions { margin-top: 8px; display: flex; gap: 6px; }
  .ed button { font-size: 12px; padding: 4px 8px; border-radius: 4px; border: 1px solid #D1D5DB;
               background: #F9FAFB; color: #111827; cursor: pointer; }
  .ed button.primary { background: #6C5CE7; color: #FFFFFF; border-color: #6C5CE7; }
  @media (prefers-color-scheme: dark) {
    .ed button { background: #1F1F2E; color: #F9FAFB; }
    .ed button.primary { background: #8B7CF0; color: #FFFFFF; border-color: #8B7CF0; }
  }
  .ed .cap-msg { margin-top: 8px; font-size: 11px; }
  .ed .cap-msg a { color: #6C5CE7; }
  @media (prefers-color-scheme: dark) { .ed .cap-msg a { color: #8B7CF0; } }
</style>
<div class="ed" role="dialog" aria-label="Per-listing cost editor">
  <label data-i18n="editCost">Real item cost</label>
  <input type="number" min="0" step="0.01" data-field="cost" value="${current.cost}" />
  <label data-i18n="editShipping">Real shipping cost</label>
  <input type="number" min="0" step="0.01" data-field="shipping" value="${current.shipping}" />
  <div class="actions">
    <button type="button" data-action="cancel" data-i18n="cancel">Cancel</button>
    <button type="button" data-action="save" class="primary" data-i18n="save">Save real numbers</button>
  </div>
  <div class="cap-msg" data-cap-slot></div>
</div>
  `.trim();let displayHost=td.querySelector("div[data-enp-cell-host]");displayHost&&(displayHost.style.display="none"),td.appendChild(host);let cancelBtn=shadow.querySelector('button[data-action="cancel"]'),saveBtn=shadow.querySelector('button[data-action="save"]'),capSlot=shadow.querySelector("[data-cap-slot]"),close=async()=>{host.remove(),displayHost&&(displayHost.style.display="inline-block"),await recompute()};cancelBtn?.addEventListener("click",()=>{close()}),saveBtn?.addEventListener("click",async()=>{let allowed=!0,remaining=0;try{let res=await chrome.runtime.sendMessage({action:"CONTENT_CAP_INCREMENT",listingId});allowed=!!res?.allowed,remaining=Number(res?.remaining??0)}catch(err){console.warn("[ebay-net-profit] cap-check SW unreachable:",err)}if(!allowed){let url=PRICING_URL("cap-hit");capSlot&&(capSlot.innerHTML=`<span data-i18n="capHit">You hit the free 30-edit cap. Pro removes it.</span> <a href="${url}" target="_blank" rel="noopener">See both plans \u2192</a>`,capSlot.querySelector("a")?.addEventListener("click",()=>{logFunnelEvent({type:"paywall-view",ts:"",surface:"cap-hit"}),logFunnelEvent({type:"cta-click",ts:"",surface:"cap-hit"}),emit("paywall_shown",{surface:"cap-hit"}),emit("cta_click",{surface:"cap-hit"})})),logFunnelEvent({type:"cap-hit",ts:"",surface:"inline-editor"}),emit("cap_hit",{surface:"inline-editor"});return}let costInput=shadow.querySelector('input[data-field="cost"]'),shippingInput=shadow.querySelector('input[data-field="shipping"]'),cost=Number(costInput?.value)||0,shipping=Number(shippingInput?.value)||0;await setListingOverride(listingId,{cost,shipping}),logFunnelEvent({type:"per-listing-edit",ts:"",surface:"seller-hub-editor"}),await close(),sessionEditCount++,sessionEditCount===POST_SUCCESS_TRIGGER_AFTER&&showPostSuccessToast()})}var POST_SUCCESS_TRIGGER_AFTER=5,sessionEditCount=0,postSuccessToastShown=!1;function showPostSuccessToast(){if(!postSuccessToastShown){postSuccessToastShown=!0;try{let host=document.createElement("div");host.setAttribute("data-enp-post-success","1"),host.style.all="initial",host.style.position="fixed",host.style.right="16px",host.style.bottom="16px",host.style.zIndex="2147483647";let shadow=host.attachShadow({mode:"closed"});shadow.innerHTML=`
<style>
  .toast {
    font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #FFFFFF; color: #111827; padding: 12px 16px;
    border: 1px solid #E5E7EB; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.18);
    font-size: 13px; max-width: 320px;
  }
  .toast a { color: #6C5CE7; font-weight: 600; }
  .toast .dismiss {
    display: inline-block; margin-top: 8px; font-size: 11.5px;
    color: #6B7280; background: none; border: 0; cursor: pointer;
    padding: 0; font-family: inherit;
  }
  .toast .dismiss:hover { color: #111827; }
  @media (prefers-color-scheme: dark) {
    .toast { background: #1F1F2E; color: #F9FAFB; border-color: #374151; }
    .toast a { color: #8B7CF0; }
    .toast .dismiss { color: #9CA3AF; }
    .toast .dismiss:hover { color: #F9FAFB; }
  }
</style>
<div class="toast" role="status" aria-live="polite">
  <div>You just saved five per-listing edits. Pro removes the daily cap.</div>
  <div style="margin-top:6px;">
    <a href="${PRICING_URL("post-success")}" target="_blank" rel="noopener">See both plans at zovo.one</a>
  </div>
  <button type="button" class="dismiss" data-action="dismiss">Maybe later</button>
</div>
    `.trim(),document.body.appendChild(host),logFunnelEvent({type:"paywall-view",ts:"",surface:"post-success"}),emit("paywall_shown",{surface:"post-success"}),shadow.querySelector("a")?.addEventListener("click",()=>{logFunnelEvent({type:"cta-click",ts:"",surface:"post-success"}),emit("cta_click",{surface:"post-success"})}),shadow.querySelector('button[data-action="dismiss"]')?.addEventListener("click",()=>{try{host.remove()}catch{}}),setTimeout(()=>{try{host.remove()}catch{}},3e4)}catch(err){console.warn("[ebay-net-profit] post-success toast render failed:",err)}}}function cssEscape(s){return typeof CSS<"u"&&typeof CSS.escape=="function"?CSS.escape(s):`"${s.replace(/["\\]/g,"\\$&")}"`}var observer=null;async function mountSurfaceB(){let tbody;try{tbody=await waitForElement2(ACTIVE_LISTINGS_TABLE_BODY_SELECTORS,1e4,500)}catch{return!1}return ensureHeader(),await renderAllCells(tbody),observer=new MutationObserver(debounce(()=>{(async()=>(ensureHeader(),await renderAllCells(tbody)))()},DEBOUNCE_MS)),observer.observe(tbody,{childList:!0,subtree:!1}),!0}function unmountSurfaceB(){observer&&(observer.disconnect(),observer=null)}async function renderAllCells(tbody){let[defaultCost,defaultShipping,storeTier,intl,showDelta]=await Promise.all([getDefaultCost(),getDefaultShipping(),getStoreTier(),getIntl(),getShowDelta()]),categoryOverrides=await getCategoryOverrides(),tier=storeTier,rows=Array.from(tbody.querySelectorAll("tr"));for(let row of rows){if(row.parentElement&&row.parentElement.tagName==="THEAD")continue;let existing=row.querySelector(`td[${ROW_CELL_ATTR}]`);if(existing){await refreshCell(row,existing,defaultCost,defaultShipping,tier,intl,categoryOverrides,showDelta);continue}let{id:listingId}=extractListingId(row),salePrice=extractRowPrice(row),override=await getListingOverride(listingId),input={salePrice,itemCost:override?.cost??defaultCost,shippingCost:override?.shipping??defaultShipping,storeTier:tier,intlOn:intl,categoryName:"",categoryOverrides},result=computeProfit(input,CATEGORIES_TABLE2),td=buildCellHost(listingId);renderCellContent(td,result,showDelta),row.appendChild(td),td.addEventListener("click",async ev=>{ev.preventDefault(),ev.stopPropagation(),await openInlineEditor(listingId,row,override??{cost:defaultCost,shipping:defaultShipping},async()=>{await renderAllCells(tbody)})})}}async function refreshCell(row,td,defaultCost,defaultShipping,tier,intl,categoryOverrides,showDelta){let listingId=td.getAttribute(ROW_CELL_ATTR);if(!listingId||td.querySelector("div[data-enp-editor-host]"))return;let salePrice=extractRowPrice(row),override=await getListingOverride(listingId),input={salePrice,itemCost:override?.cost??defaultCost,shippingCost:override?.shipping??defaultShipping,storeTier:tier,intlOn:intl,categoryName:"",categoryOverrides},result=computeProfit(input,CATEGORIES_TABLE2);renderCellContent(td,result,showDelta)}function debounce(fn,ms){let timer=null;return(...args)=>{timer&&clearTimeout(timer),timer=setTimeout(()=>fn(...args),ms)}}function isDifferentLocalDay(aEpochMs,bEpochMs){if(!Number.isFinite(aEpochMs)||!Number.isFinite(bEpochMs))return!0;let a=new Date(aEpochMs),b=new Date(bEpochMs);return a.getFullYear()!==b.getFullYear()||a.getMonth()!==b.getMonth()||a.getDate()!==b.getDate()}async function catchUpResetCapIfStale(){try{let resetAtStr=await getEditsResetAt(),resetAtMs=Date.parse(resetAtStr),nowMs=Date.now();(!Number.isFinite(resetAtMs)||isDifferentLocalDay(resetAtMs,nowMs))&&(await setEditsToday(0),await setEditsResetAt(new Date(nowMs).toISOString()))}catch(err){console.warn("[ebay-net-profit] catchUpResetCapIfStale failed:",err)}}var currentSurface="none",historyPatched=!1,navDebounce=null;async function mountForCurrentPage(){let showColumn=await getShowColumn(),kind=detectPage(),target=kind==="sell-form"?"sell-form":kind==="seller-hub"&&showColumn?"seller-hub":"none";target!==currentSurface&&(currentSurface==="seller-hub"&&unmountSurfaceB(),currentSurface=target,target==="sell-form"?mountSurfaceA():target==="seller-hub"&&mountSurfaceB())}function onSpaNav(){navDebounce&&clearTimeout(navDebounce),navDebounce=setTimeout(()=>{mountForCurrentPage()},250)}function patchHistoryIfNeeded(){if(!historyPatched)try{let nativePush=history.pushState.bind(history),nativeReplace=history.replaceState.bind(history);history.pushState=function(...args){nativePush(...args),onSpaNav()},history.replaceState=function(...args){nativeReplace(...args),onSpaNav()},window.addEventListener("popstate",onSpaNav),historyPatched=!0}catch(err){console.warn("[ebay-net-profit] history patch failed (popstate still wired):",err);try{window.addEventListener("popstate",onSpaNav)}catch{}}}chrome.runtime.onMessage.addListener(msg=>{try{msg?.action==="PREFS_CHANGED"&&onSpaNav()}catch(err){console.warn("[ebay-net-profit] onMessage handler failed:",err)}return!1});async function boot(){try{await catchUpResetCapIfStale(),await mountForCurrentPage(),patchHistoryIfNeeded(),window.addEventListener("pagehide",()=>{try{unmountSurfaceB()}catch{}})}catch(err){console.warn("[ebay-net-profit] boot failed:",err)}}boot();})();
