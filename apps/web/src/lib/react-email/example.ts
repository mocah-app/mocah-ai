/**
 * Example React Email JSX for testing
 * Use this to test the rendering pipeline
 */

export const exampleReactEmailCode = `
import React from 'react';
import { Container, Row, Column, Heading, Head, Body, Text, Button, Img, Link, Html, Section, Hr, Preview, Tailwind, Markdown, Font, CodeBlock } from '@react-email/components';

export default function BluebirdWelcomeEmail({
  firstName = 'Friend',
  unsubscribeUrl = 'https://bluebirddesigns.com/unsubscribe',
  browserUrl = 'https://bluebirddesigns.com/view-in-browser'
}) {
  // --- Configuration & Colors ---
  const colors = {
    accent: '#3b82f6', // Bright Blue from brand
    text: '#212529',
    subText: '#4b5563',
    bgPage: '#ffffff',
    bgContainer: '#f8f9fa',
    footerInfoBg: '#a8d0e6', // Specific footer color from research
    white: '#ffffff',
    border: '#e5e7eb'
  };

  // --- Assets ---
  const logoUrl = "https://cdn.migma.ai/projects/692314cda6f3fd2316d36896/logos/Blue_Bird_Designs_wFloral_Circle_logo_n8v335.png";
  const heroImage = "https://cdn.migma.ai/projects/692314cda6f3fd2316d36896/images/close-up-hero-image-of-a-sterling-silver-and-ename_hpmjpq.jpeg";
  const necklaceImage = "https://cdn.migma.ai/projects/692314cda6f3fd2316d36896/images/instagram-post-image-showing-a-detailed-star-shape_pafzny.jpeg"; // Using star pendant as proxy for necklace collection
  const earringsImage = "https://cdn.migma.ai/projects/692314cda6f3fd2316d36896/images/instagram-post-image-promoting-a-valentine-s-event_on19dn.jpeg"; // Using colorful event image for earrings vibe
  
  // --- Styles ---
  const main = {
    backgroundColor: colors.bgPage,
    fontFamily: 'Inter, Arial, sans-serif',
    margin: '0',
    padding: '0',
  };

  const containerStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: colors.bgPage,
  };

  const sectionPadding = {
    paddingTop: '40px',
    paddingBottom: '40px',
    paddingLeft: '40px',
    paddingRight: '40px',
  };

  const headingStyle = {
    fontSize: '32px',
    fontWeight: '700',
    color: colors.text,
    lineHeight: '1.2',
    margin: '0 0 20px 0',
    textAlign: 'center',
  };

  const subHeadingStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: colors.accent,
    margin: '0 0 16px 0',
    textAlign: 'center',
  };

  const paragraphStyle = {
    fontSize: '16px',
    lineHeight: '1.6',
    color: colors.subText,
    margin: '0 0 24px 0',
    textAlign: 'center',
  };

  const buttonStyle = {
    backgroundColor: colors.accent,
    color: colors.white,
    fontSize: '16px',
    fontWeight: '700',
    textDecoration: 'none',
    padding: '16px 32px',
    borderRadius: '4px', // Requested 4px radius
    display: 'inline-block',
    textAlign: 'center',
    border: 'none',
  };

  const giantCouponStyle = {
    fontSize: '60px', // The Giant
    fontWeight: '700',
    color: colors.text,
    margin: '20px 0',
    textAlign: 'center',
    letterSpacing: '-1px',
    lineHeight: '1',
  };

  const navLinkStyle = {
    color: colors.text,
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    padding: '0 10px',
    textTransform: 'uppercase',
  };

  const pillStyle = {
    backgroundColor: colors.white,
    border: \`1px solid \${colors.border}\`,
    borderRadius: '50px',
    padding: '16px 24px',
    marginBottom: '16px',
    width: '100%',
  };

  const pillTitle = {
    fontSize: '16px',
    fontWeight: '700',
    color: colors.text,
    margin: '0',
  };

  const pillText = {
    fontSize: '14px',
    color: colors.subText,
    margin: '4px 0 0 0',
    lineHeight: '1.4',
  };

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Welcome to the Bluebird Family - Your Gift Inside</title>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2",
            format: "woff2",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
        <style>{\`
          @media only screen and (max-width: 600px) {
            .mobile-image { width: 100% !important; height: auto !important; max-width: 100% !important; }
            .mobile-button { width: 100% !important; box-sizing: border-box !important; display: block !important; }
            .content-padding { padding-left: 20px !important; padding-right: 20px !important; }
            .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; padding-bottom: 20px !important; }
            .nav-stack { display: block !important; width: 100% !important; text-align: center !important; padding-bottom: 10px !important; }
            .giant-text { font-size: 42px !important; }
          }
        \`}</style>
      </Head>
      <Preview>Welcome to the family! Here is your 20% off gift inside.</Preview>
      <Body style={main}>
        <Container style={containerStyle}>
          
          {/* HEADER: Logo & Nav */}
          <Section style={{ backgroundColor: colors.white, padding: '30px 0 20px 0' }}>
            <table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
              <tr>
                <td align="center" style={{ paddingBottom: '24px' }}>
                  <Img
                    src={logoUrl}
                    width="120"
                    height="auto"
                    alt="Bluebird Designs - Artisan Jewelry"
                    style={{ display: 'block', maxWidth: '120px' }}
                  />
                </td>
              </tr>
              <tr>
                <td align="center">
                  <table border="0" cellPadding="0" cellSpacing="0" role="presentation">
                    <tr>
                      <td style={{ padding: '0 10px' }}><Link href="https://bluebirddesigns.com/artisan-jewelry" style={navLinkStyle}>Shop</Link></td>
                      <td style={{ padding: '0 10px' }}><Link href="https://bluebirddesigns.com/boutique-and-working-studio" style={navLinkStyle}>Studio</Link></td>
                      <td style={{ padding: '0 10px' }}><Link href="https://bluebirddesigns.com/blog" style={navLinkStyle}>Blog</Link></td>
                      <td style={{ padding: '0 10px' }}><Link href="https://bluebirddesigns.com/artisan-jessica-blissett" style={navLinkStyle}>About</Link></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </Section>

          {/* SECTION 1: HERO - Inspirational Welcome */}
          <Section style={{ ...sectionPadding, backgroundColor: colors.bgContainer }} className="content-padding">
            <Heading as="h1" style={headingStyle}>
              Finding Your Balance,<br />Embracing Happiness.
            </Heading>
            <Text style={paragraphStyle}>
              Dear {firstName}, welcome to the Bluebird family! We believe jewelry should be more than adornment—it should be a keepsake, a reminder to cherish the beauty, play, and love in your life. Jessica creates each piece to capture that spirit.
            </Text>
            <Img
              src={heroImage}
              width="520"
              height="auto"
              alt="Close-up of sterling silver and enamel bluebird necklace with pearl accents"
              style={{ width: '100%', height: 'auto', borderRadius: '4px', display: 'block' }}
              className="mobile-image"
            />
          </Section>

          {/* SECTION 2: THE GIANT COUPON */}
          <Section style={{ ...sectionPadding, backgroundColor: colors.white, paddingTop: '50px', paddingBottom: '50px' }} className="content-padding">
            <Heading as="h2" style={subHeadingStyle}>
              Your Welcome Gift: Claim 20% Off
            </Heading>
            <Text style={{ ...paragraphStyle, marginBottom: '10px' }}>
              Use this code at checkout for your first artisan purchase.
            </Text>
            
            {/* THE GIANT ELEMENT */}
            <Section style={{ border: \`2px dashed \${colors.accent}\`, borderRadius: '8px', padding: '20px', margin: '20px 0' }}>
                <Text style={giantCouponStyle} className="giant-text">
                HAPPYBIRD20
                </Text>
            </Section>

            <table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
              <tr>
                <td align="center">
                  <Button
                    href="https://bluebirddesigns.com/artisan-jewelry"
                    style={buttonStyle}
                    className="mobile-button"
                  >
                    SHOP THE ARTISAN COLLECTION NOW
                  </Button>
                </td>
              </tr>
            </table>
          </Section>

          {/* SECTION 3: BRAND VALUE PILLS */}
          <Section style={{ ...sectionPadding, backgroundColor: colors.bgContainer }} className="content-padding">
            <Heading as="h3" style={{ ...headingStyle, fontSize: '24px' }}>
              Why We Create
            </Heading>
            
            {/* Pill 1 */}
            <table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style={pillStyle}>
              <tr>
                <td width="50" valign="middle" align="center">
                   <Img src="https://cdn.migma.ai/icons/fa6/FaGem/3b82f6.png" width="24" height="auto" alt="Gem Icon" style={{ display: 'block' }} />
                </td>
                <td valign="middle" style={{ paddingLeft: '16px' }}>
                  <Text style={pillTitle}>Sterling Silver & Enamel</Text>
                  <Text style={pillText}>Meticulously designed and handmade by Jessica in Asheville, NC.</Text>
                </td>
              </tr>
            </table>

            {/* Pill 2 */}
            <table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style={pillStyle}>
              <tr>
                <td width="50" valign="middle" align="center">
                   <Img src="https://cdn.migma.ai/icons/fa6/FaDove/3b82f6.png" width="24" height="auto" alt="Bird Icon" style={{ display: 'block' }} />
                </td>
                <td valign="middle" style={{ paddingLeft: '16px' }}>
                  <Text style={pillTitle}>The Bluebird of Happiness</Text>
                  <Text style={pillText}>A meaningful keepsake to remind you to find balance and cherish life.</Text>
                </td>
              </tr>
            </table>

            {/* Pill 3 */}
            <table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style={pillStyle}>
              <tr>
                <td width="50" valign="middle" align="center">
                   <Img src="https://cdn.migma.ai/icons/fa6/FaStore/3b82f6.png" width="24" height="auto" alt="Store Icon" style={{ display: 'block' }} />
                </td>
                <td valign="middle" style={{ paddingLeft: '16px' }}>
                  <Text style={pillTitle}>Visit Our Working Studio</Text>
                  <Text style={pillText}>See the creative process firsthand at our Asheville boutique.</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* SECTION 4: FEATURED COLLECTIONS (2-Column) */}
          <Section style={{ ...sectionPadding, backgroundColor: colors.white }} className="content-padding">
            <Heading as="h3" style={{ ...headingStyle, fontSize: '28px', marginBottom: '40px' }}>
              Start with a Piece that Speaks to Your Heart
            </Heading>

            <Row>
              {/* Column 1 */}
              <Column className="stack-column" style={{ width: '50%', paddingRight: '10px', verticalAlign: 'top' }}>
                <table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                  <tr>
                    <td>
                      <Img
                        src={necklaceImage}
                        width="240"
                        height="240"
                        alt="Signature Bluebird Necklace"
                        style={{ width: '100%', height: 'auto', borderRadius: '4px', display: 'block', objectFit: 'cover' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style={{ padding: '20px 0' }}>
                      <Text style={{ fontSize: '18px', fontWeight: '700', color: colors.text, margin: '0 0 8px 0' }}>Signature Bluebirds</Text>
                      <Text style={{ fontSize: '14px', color: colors.subText, margin: '0 0 16px 0', lineHeight: '1.5' }}>
                        Iconic designs symbolizing joy, balance, and good fortune.
                      </Text>
                      <Button href="https://bluebirddesigns.com/artisan-jewelry" style={{ ...buttonStyle, padding: '12px 24px', fontSize: '14px', backgroundColor: colors.text }}>
                        DISCOVER BLUEBIRDS
                      </Button>
                    </td>
                  </tr>
                </table>
              </Column>

              {/* Column 2 */}
              <Column className="stack-column" style={{ width: '50%', paddingLeft: '10px', verticalAlign: 'top' }}>
                <table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                  <tr>
                    <td>
                      <Img
                        src={earringsImage}
                        width="240"
                        height="240"
                        alt="Colorful Enamel Earrings"
                        style={{ width: '100%', height: 'auto', borderRadius: '4px', display: 'block', objectFit: 'cover' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style={{ padding: '20px 0' }}>
                      <Text style={{ fontSize: '18px', fontWeight: '700', color: colors.text, margin: '0 0 8px 0' }}>Enamel Earrings</Text>
                      <Text style={{ fontSize: '14px', color: colors.subText, margin: '0 0 16px 0', lineHeight: '1.5' }}>
                        Vibrant, light, and nature-inspired art to brighten your day.
                      </Text>
                      <Button href="https://bluebirddesigns.com/artisan-jewelry" style={{ ...buttonStyle, padding: '12px 24px', fontSize: '14px', backgroundColor: colors.text }}>
                        BROWSE EARRINGS
                      </Button>
                    </td>
                  </tr>
                </table>
              </Column>
            </Row>
          </Section>

          {/* SECTION 5: ARTIST'S VOICE */}
          <Section style={{ ...sectionPadding, backgroundColor: colors.bgContainer }} className="content-padding">
            <Img 
                src="https://cdn.migma.ai/icons/fa6/FaQuoteLeft/3b82f6.png" 
                width="32" 
                height="auto" 
                alt="Quote" 
                style={{ display: 'block', margin: '0 auto 20px auto' }} 
            />
            <Text style={{ ...paragraphStyle, fontStyle: 'italic', fontSize: '20px', color: colors.text }}>
              "I like to think my keepsake jewelry reminds you to find that balance and embrace your own happiness, and to cherish and celebrate friendships and family!"
            </Text>
            <Text style={{ fontSize: '16px', fontWeight: '700', color: colors.text, textAlign: 'center', margin: '0 0 30px 0' }}>
              — Jessica Hall Blissett, Owner & Artist
            </Text>
            <table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
              <tr>
                <td align="center">
                  <Button
                    href="https://bluebirddesigns.com/artisan-jessica-blissett"
                    style={{ ...buttonStyle, backgroundColor: 'transparent', border: \`2px solid \${colors.accent}\`, color: colors.accent }}
                    className="mobile-button"
                  >
                    READ MORE ABOUT JESSICA
                  </Button>
                </td>
              </tr>
            </table>
          </Section>

          {/* FOOTER */}
          {/* Info Line - Blue/Green Background */}
          <Section style={{ backgroundColor: colors.footerInfoBg, padding: '20px 40px' }} className="content-padding">
            <Text style={{ fontSize: '14px', color: colors.text, textAlign: 'center', margin: '0', lineHeight: '1.6' }}>
              191 Lyman St ste 262, Asheville, NC, 28801, USA<br />
              7753383880 | jessica@bluebirddesigns.com
            </Text>
          </Section>

          {/* Links & Socials - White Background */}
          <Section style={{ backgroundColor: colors.white, padding: '40px 40px' }} className="content-padding">
            <table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
              <tr>
                <td align="center" style={{ paddingBottom: '24px' }}>
                  <Link href="https://bluebirddesigns.com/contact" style={{ ...navLinkStyle, display: 'block', margin: '8px 0' }}>Contact</Link>
                  <Link href="https://bluebirddesigns.com/artisan-jessica-blissett" style={{ ...navLinkStyle, display: 'block', margin: '8px 0' }}>About Jessica H Blissett</Link>
                  <Link href="https://bluebirddesigns.com/workshops-and-events" style={{ ...navLinkStyle, display: 'block', margin: '8px 0' }}>Workshops and Events</Link>
                  <Link href="https://bluebirddesigns.com/artist-portfolio" style={{ ...navLinkStyle, display: 'block', margin: '8px 0' }}>Artist Portfolio</Link>
                </td>
              </tr>
              <tr>
                <td align="center" style={{ paddingBottom: '24px' }}>
                  {/* Social Icons */}
                  <table cellPadding="0" cellSpacing="0" border="0" align="center">
                    <tr>
                      <td style={{ padding: '0 12px' }}>
                        <Link href="mailto:jessica@bluebirddesigns.com" target="_blank">
                          <Img 
                            src="https://cdn.migma.ai/icons/fa6/FaEnvelope/212529.png" 
                            alt="Email" 
                            width="24" 
                            height="auto" 
                            style={{ display: 'block' }} 
                          />
                        </Link>
                      </td>
                      <td style={{ padding: '0 12px' }}>
                        <Link href="https://www.pinterest.com/bluebirdpics/" target="_blank">
                          <Img 
                            src="https://cdn.migma.ai/icons/fa6/FaPinterest/212529.png" 
                            alt="Pinterest" 
                            width="24" 
                            height="auto" 
                            style={{ display: 'block' }} 
                          />
                        </Link>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <Text style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 8px 0' }}>
                    © 2025 Bluebird Designs. All rights reserved.
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>
                    <Link href={unsubscribeUrl} style={{ color: '#9ca3af', textDecoration: 'underline' }}>Unsubscribe</Link>
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

`;

/**
 * Test the rendering pipeline
 */
export async function testRendering() {
  try {
    const { renderReactEmail, validateReactEmailCode } = await import('./index');
    
    // 1. Validate the code
    const validation = validateReactEmailCode(exampleReactEmailCode);
    console.log('Validation:', validation);
    
    if (!validation.isValid) {
      throw new Error(`Invalid code: ${validation.errors.join(', ')}`);
    }
    
    // 2. Render to HTML
    const html = await renderReactEmail(exampleReactEmailCode);
    console.log('Rendered HTML length:', html.length);
    
    return {
      success: true,
      html,
      htmlLength: html.length,
    };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Example usage in a component:
 * 
 * ```typescript
 * import { renderReactEmailWithIds } from '@/lib/react-email';
 * import { exampleReactEmailCode } from '@/lib/react-email/example';
 * 
 * const MyComponent = () => {
 *   const [html, setHtml] = useState('');
 *   
 *   useEffect(() => {
 *     renderReactEmailWithIds(exampleReactEmailCode)
 *       .then(setHtml)
 *       .catch(console.error);
 *   }, []);
 *   
 *   return <iframe srcDoc={html} />;
 * };
 * ```
 */

