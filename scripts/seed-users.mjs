import { createClient } from '@supabase/supabase-js';
const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;const password=process.env.TEST_USER_PASSWORD;
if(!url||!key||!password||password.length<12)throw new Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and a TEST_USER_PASSWORD with at least 12 characters in .env.seed.');
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const accounts=[['customer@wasl.test','Lina Hassan','customer'],['other.customer@wasl.test','Mariam Ali','customer'],['agent@wasl.test','Omar Saleh','agent'],['agent.two@wasl.test','Youssef Adel','agent'],['manager@wasl.test','Nadia Farouk','manager']];
for(const [email,name,role]of accounts){
  let user;let page=1;
  for(;;){const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});if(error)throw error;user=data.users.find(u=>u.email===email);if(user||data.users.length<1000)break;page++;}
  if(!user){const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:name}});if(error)throw error;user=data.user;}else{const {error}=await admin.auth.admin.updateUserById(user.id,{password,email_confirm:true,user_metadata:{full_name:name}});if(error)throw error;}
  const {error}=await admin.from('profiles').update({role,full_name:name}).eq('id',user.id);if(error)throw error;
  console.log(`${email} | ${role} | ${user.id}`);
}
console.log('Test users are ready. Use TEST_USER_PASSWORD to sign in. Do not use these accounts or a shared password in production.');
