# 🔒 SSL Certificate Browser Setup - RevivaTech

## Eliminating "Your connection is not private" Warnings

If you're still seeing SSL certificate warnings after the certificate update, follow these steps:

### 🧹 Clear Browser Certificate Cache

#### Chrome/Chromium:
1. Open Chrome Settings (`chrome://settings/`)
2. Click "Privacy and Security" → "Clear browsing data"
3. Select "Advanced" tab
4. Check only "Cached images and files" and "Cookies and other site data"
5. Time range: "All time"
6. Click "Clear data"
7. Restart Chrome completely

#### Firefox:
1. Open Firefox Settings (`about:preferences`)
2. Go to "Privacy & Security"
3. Scroll to "Cookies and Site Data" 
4. Click "Clear Data"
5. Check both "Cookies and Site Data" and "Cached Web Content"
6. Click "Clear"
7. Restart Firefox

#### Safari (macOS):
1. Safari → Preferences → Privacy
2. Click "Manage Website Data"
3. Click "Remove All"
4. Safari → Develop → Empty Caches (if Develop menu enabled)
5. Restart Safari

#### Edge:
1. Settings (`edge://settings/`)
2. Privacy, search, and services
3. "Clear browsing data now" → "Choose what to clear"
4. Select "Cached images and files" and "Cookies and other site data"
5. Click "Clear now"
6. Restart Edge

### 🔧 Alternative: Manual Root CA Installation

If clearing cache doesn't work, manually install the mkcert root CA:

#### Export Root CA:
```bash
# Copy the root CA certificate to a accessible location
cp ~/.local/share/mkcert/rootCA.pem /tmp/mkcert-root-ca.crt
```

#### Install in Browser:

**Chrome/Chromium:**
1. Settings → Privacy and Security → Security → Manage certificates
2. "Authorities" tab → "Import"
3. Select the `rootCA.pem` file
4. Check "Trust this certificate for identifying websites"
5. Restart Chrome

**Firefox:**
1. Settings → Privacy & Security → Certificates → "View Certificates"
2. "Authorities" tab → "Import"
3. Select the `rootCA.pem` file  
4. Check "Trust this CA to identify websites"
5. Restart Firefox

### ✅ Verification Steps

After clearing cache/installing CA, test these URLs:

1. **Local Development**: `https://localhost:3010`
   - Should show green lock icon 🔒
   - No certificate warnings

2. **Tailscale Access**: `https://100.122.130.67:3010`
   - Should show green lock icon 🔒
   - No certificate warnings

3. **Certificate Details**:
   - Click the lock icon in browser address bar
   - Certificate should show:
     - Issued by: "mkcert root@homelab" 
     - Valid until: November 11, 2027
     - Subject Alternative Names include all access methods

### 🚨 Troubleshooting

**Still seeing warnings?**
1. Hard refresh the page: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS)
2. Try incognito/private browsing mode
3. Check if browser has its own certificate store that needs updating
4. Ensure system time is correct (SSL certificates are time-sensitive)

**Certificate not trusted?**
1. Verify mkcert root CA is installed: `mkcert -CAROOT`
2. Reinstall mkcert CA: `mkcert -install`
3. Regenerate certificates if needed

### 📞 Success Verification

You should see:
- ✅ Green lock icon in address bar
- ✅ No "Not secure" or certificate warnings
- ✅ HTTPS working on all access methods
- ✅ No `net::ERR_CERT_COMMON_NAME_INVALID` errors

---

**Last Updated**: August 11, 2025  
**Certificate Valid Until**: November 11, 2027