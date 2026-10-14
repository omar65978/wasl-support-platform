import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
await mkdir('docs/screenshots',{recursive:true});
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const base=process.env.BASE_URL||'http://localhost:4173';
for(const app of ['customer','support']){
  await page.goto(`${base}/${app}/`);
  await page.getByRole('button',{name:app==='customer'?'Try as a customer':'Try as a manager'}).click();
  await page.getByRole('heading',{name:app==='customer'?'Your requests':'All requests',exact:true}).waitFor();
  await page.screenshot({path:`docs/screenshots/${app}-desktop.png`,fullPage:true});
}
await page.getByRole('link',{name:'Unable to download my monthly invoice',exact:true}).click();
await page.getByRole('heading',{name:'Conversation',exact:true}).waitFor();
await page.screenshot({path:'docs/screenshots/support-conversation.png',fullPage:true});
await page.getByRole('link',{name:'Workload overview',exact:true}).click();
await page.getByRole('heading',{name:'Team workload',exact:true}).waitFor();
await page.screenshot({path:'docs/screenshots/manager-overview.png',fullPage:true});
await browser.close();
