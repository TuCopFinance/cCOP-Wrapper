# Farcaster Miniapp Integration

Complete guide for the Farcaster miniapp integration for cCOP Wrapper.

## Prerequisites

1. A Farcaster account with a registered FID (Farcaster ID)
2. Ownership of the domain where the app will be hosted (e.g., copwrapper.xyz)
3. Access to deploy the application to a public URL

## Current Implementation Status

✅ Farcaster SDK integrated  
✅ Wagmi connector configured  
✅ Auto-connect functionality implemented  
✅ Manifest file created  
✅ Webhook endpoint configured  
✅ User context and display  

⚠️ **Pending**: Account association signature generation

## Account Association Setup

The account association is a cryptographic proof that links your domain to your Farcaster account. This is required for the miniapp to be recognized by Farcaster.

### What You Need

- **Your Farcaster FID**: Find this in your Farcaster profile settings
- **Your domain**: The domain where the app is hosted (e.g., copwrapper.xyz)
- **Custody wallet private key**: The private key associated with your Farcaster account

### Generating the Account Association

#### Option 1: Using Farcaster CLI (Recommended)

```bash
# Install Farcaster CLI
npm install -g @farcaster/cli

# Generate account association
farcaster account-association create \
  --fid YOUR_FID \
  --domain copwrapper.xyz \
  --private-key YOUR_PRIVATE_KEY
```

This will output three values:
- `header`: Base64-encoded header
- `payload`: Base64-encoded payload  
- `signature`: Cryptographic signature

#### Option 2: Using Farcaster API

You can also generate the account association using the Farcaster Hub API:

```typescript
import { makeAccountAssociation } from '@farcaster/hub-nodejs';

const association = await makeAccountAssociation({
  fid: YOUR_FID,
  type: 'custody',
  domain: 'copwrapper.xyz',
  privateKey: YOUR_PRIVATE_KEY_BYTES
});

console.log('Header:', association.header);
console.log('Payload:', association.payload);
console.log('Signature:', association.signature);
```

### Updating the Manifest

Once you have the account association values, update the manifest file at `public/.well-known/farcaster.json`:

```json
{
  "version": "1",
  "accountAssociation": {
    "header": "YOUR_GENERATED_HEADER",
    "payload": "YOUR_GENERATED_PAYLOAD",
    "signature": "YOUR_GENERATED_SIGNATURE"
  },
  ...
}
```

## Deployment Checklist

### 1. Pre-Deployment

- [ ] Generate account association signature
- [ ] Update `farcaster.json` with the signature
- [ ] Verify all icons are present (icon.png, splash.png, image.png)
- [ ] Test build locally: `npm run build`
- [ ] Ensure webhook endpoint is functional

### 2. Deploy to Production

- [ ] Deploy to your hosting provider (Vercel, Netlify, etc.)
- [ ] Verify manifest is accessible at: `https://your-domain.com/.well-known/farcaster.json`
- [ ] Test manifest validity using curl:
  ```bash
  curl https://copwrapper.xyz/.well-known/farcaster.json
  ```

### 3. Submit to Farcaster

- [ ] Visit the Farcaster miniapp submission portal
- [ ] Submit your domain for review
- [ ] Wait for approval (typically 1-3 days)
- [ ] Test in Farcaster client once approved

## Testing

### Local Testing

1. Start the development server:
   ```bash
   cd dapp
   npm run dev
   ```

2. Open the browser console and check for:
   - "Farcaster SDK initialized successfully" (when running in Farcaster)
   - No errors related to SDK initialization

### Production Testing

1. Deploy to a staging environment
2. Access the manifest URL directly
3. Verify all fields are correctly populated
4. Test the webhook endpoint:
   ```bash
   curl -X POST https://your-domain.com/api/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"test","data":{}}'
   ```

## Features of the Integration

### Auto-Connect
When users open the app in Farcaster, their wallet automatically connects without requiring manual interaction.

### User Display
The app shows the Farcaster user's profile picture and username in the header when running as a miniapp.

### Full Functionality
All wrapping and unwrapping features work seamlessly within the Farcaster environment.

### Webhook Events
The app receives notifications when:
- The miniapp is added to Farcaster
- The miniapp is removed from Farcaster
- Custom notification events are triggered

## Troubleshooting

### Manifest Not Accessible
- Verify the `.well-known` directory is being served by Next.js
- Check that headers are properly configured in `next.config.ts`
- Ensure no firewall or CDN rules are blocking the manifest

### SDK Not Initializing
- Check browser console for error messages
- Verify the app is actually running within Farcaster
- Ensure all dependencies are properly installed

### Wallet Not Auto-Connecting
- Verify the Farcaster connector is properly configured
- Check that the FarcasterProvider is wrapping the app
- Ensure the user has a wallet connected to their Farcaster account

### Invalid Account Association
- Verify the signature was generated correctly
- Ensure the FID matches your Farcaster account
- Check that the domain matches exactly (no www, no trailing slash)

## Resources

- [Farcaster Documentation](https://docs.farcaster.xyz/)
- [Farcaster Miniapp Guide](https://docs.base.org/mini-apps/)
- [Farcaster Hub API](https://docs.farcaster.xyz/reference/hubble/httpapi)
- [Example: cPiggy Miniapp](https://cpiggy.xyz/.well-known/farcaster.json)

## Support

If you encounter issues during setup:
1. Check the browser console for errors
2. Verify the manifest is accessible and valid
3. Review the Farcaster documentation
4. Test with the Farcaster embed tool

## Important: Ready() Call Implementation

The app includes multiple safeguards to ensure `sdk.actions.ready()` is called properly:

1. **100ms delay** before calling ready() ensures DOM is fully rendered
2. **Multiple detection methods** for Farcaster environment (SDK context, window properties, user agent)
3. **Safety mechanism** that calls ready() after 500ms as fallback
4. **Graceful error handling** prevents infinite loading screen

All of this is handled automatically by the FarcasterContext. You don't need to manually call ready().

## Next Steps

After completing the integration:
1. Generate account association signature (see above)
2. Update manifest with your FID and signature
3. Deploy and test in Farcaster client
4. Monitor the webhook endpoint for events

