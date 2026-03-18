import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';

export default function PrivacyPolicyScreen({ navigation }) {
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );

  const Para = ({ children, bold }) => (
    <Text style={[styles.para, bold && styles.bold]}>{children}</Text>
  );

  const Bullet = ({ children }) => (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#37474F', '#455A64', '#546E7A']} style={styles.gradient}>
        {/* Header */}
        <Animated.View
          style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{t(language, 'back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🔒 {t(language, 'privacyPolicyTitle')}</Text>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.lastUpdated}>Last updated: December 21, 2023</Text>

            <Para>
              This Privacy Policy describes Our policies and procedures on the collection, use and
              disclosure of Your information when You use the Service and tells You about Your
              privacy rights and how the law protects You.
            </Para>
            <Para>
              We use Your Personal data to provide and improve the Service. By using the Service,
              You agree to the collection and use of information in accordance with this Privacy
              Policy.
            </Para>

            <Section title="Interpretation and Definitions">
              <Para bold>Interpretation</Para>
              <Para>
                The words of which the initial letter is capitalized have meanings defined under
                the following conditions. The following definitions shall have the same meaning
                regardless of whether they appear in singular or in plural.
              </Para>

              <Para bold>Definitions</Para>
              <Para>For the purposes of this Privacy Policy:</Para>
              <Bullet>
                <Text style={styles.bold}>Account</Text> means a unique account created for You to
                access our Service or parts of our Service.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Affiliate</Text> means an entity that controls, is
                controlled by or is under common control with a party, where "control" means
                ownership of 50% or more of the shares, equity interest or other securities
                entitled to vote for election of directors or other managing authority.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Application</Text> refers to Mahmood Rice, the software
                program provided by the Company.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Company</Text> (referred to as either "the Company",
                "We", "Us" or "Our" in this Agreement) refers to Altunkaya A.Ş., Başpınar
                (Organize) OSB Mah. O.S.B. 4. Bölge 83409 Nolu Cad. No:3 Şehitkamil / Gaziantep
                / TÜRKİYE.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Country</Text> refers to: Turkey
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Device</Text> means any device that can access the
                Service such as a computer, a cellphone or a digital tablet.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Personal Data</Text> is any information that relates to
                an identified or identifiable individual.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Service</Text> refers to the Application.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Service Provider</Text> means any natural or legal person
                who processes the data on behalf of the Company. It refers to third-party companies
                or individuals employed by the Company to facilitate the Service, to provide the
                Service on behalf of the Company, to perform services related to the Service or to
                assist the Company in analyzing how the Service is used.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Usage Data</Text> refers to data collected automatically,
                either generated by the use of the Service or from the Service infrastructure itself
                (for example, the duration of a page visit).
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>You</Text> means the individual accessing or using the
                Service, or the company, or other legal entity on behalf of which such individual is
                accessing or using the Service, as applicable.
              </Bullet>
            </Section>

            <Section title="Collecting and Using Your Personal Data">
              <Para bold>Types of Data Collected</Para>

              <Para bold>Personal Data</Para>
              <Para>
                While using Our Service, We may ask You to provide Us with certain personally
                identifiable information that can be used to contact or identify You. Personally
                identifiable information may include, but is not limited to:
              </Para>
              <Bullet>Email address</Bullet>
              <Bullet>First name and last name</Bullet>
              <Bullet>Phone number</Bullet>
              <Bullet>Usage Data</Bullet>

              <Para bold>Usage Data</Para>
              <Para>
                Usage Data is collected automatically when using the Service. Usage Data may include
                information such as Your Device's Internet Protocol address (e.g. IP address),
                browser type, browser version, the pages of our Service that You visit, the time and
                date of Your visit, the time spent on those pages, unique device identifiers and
                other diagnostic data.
              </Para>
              <Para>
                When You access the Service by or through a mobile device, We may collect certain
                information automatically, including, but not limited to, the type of mobile device
                You use, Your mobile device unique ID, the IP address of Your mobile device, Your
                mobile operating system, the type of mobile Internet browser You use, unique device
                identifiers and other diagnostic data.
              </Para>
            </Section>

            <Section title="Use of Your Personal Data">
              <Para>The Company may use Personal Data for the following purposes:</Para>
              <Bullet>To provide and maintain our Service, including to monitor the usage of our Service.</Bullet>
              <Bullet>To manage Your Account: to manage Your registration as a user of the Service.</Bullet>
              <Bullet>For the performance of a contract: the development, compliance and undertaking of the purchase contract for the products, items or services You have purchased or of any other contract with Us through the Service.</Bullet>
              <Bullet>To contact You: To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication, such as a mobile application's push notifications regarding updates or informative communications related to the functionalities, products or contracted services, including the security updates, when necessary or reasonable for their implementation.</Bullet>
              <Bullet>To provide You with news, special offers and general information about other goods, services and events which we offer that are similar to those that you have already purchased or enquired about unless You have opted not to receive such information.</Bullet>
              <Bullet>To manage Your requests: To attend and manage Your requests to Us.</Bullet>
              <Bullet>For business transfers: We may use Your information to evaluate or conduct a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of Our assets.</Bullet>
              <Bullet>For other purposes: We may use Your information for other purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Service, products, services, marketing and your experience.</Bullet>
            </Section>

            <Section title="Sharing Your Personal Information">
              <Para>We may share Your personal information in the following situations:</Para>
              <Bullet>With Service Providers: We may share Your personal information with Service Providers to monitor and analyze the use of our Service, to contact You.</Bullet>
              <Bullet>For business transfers: We may share or transfer Your personal information in connection with, or during negotiations of, any merger, sale of Company assets, financing, or acquisition of all or a portion of Our business to another company.</Bullet>
              <Bullet>With Affiliates: We may share Your information with Our affiliates, in which case we will require those affiliates to honor this Privacy Policy.</Bullet>
              <Bullet>With business partners: We may share Your information with Our business partners to offer You certain products, services or promotions.</Bullet>
              <Bullet>With other users: when You share personal information or otherwise interact in the public areas with other users, such information may be viewed by all users and may be publicly distributed outside.</Bullet>
              <Bullet>With Your consent: We may disclose Your personal information for any other purpose with Your consent.</Bullet>
            </Section>

            <Section title="Retention of Your Personal Data">
              <Para>
                The Company will retain Your Personal Data only for as long as is necessary for the
                purposes set out in this Privacy Policy. We will retain and use Your Personal Data to
                the extent necessary to comply with our legal obligations, resolve disputes, and
                enforce our legal agreements and policies.
              </Para>
              <Para>
                The Company will also retain Usage Data for internal analysis purposes. Usage Data is
                generally retained for a shorter period of time, except when this data is used to
                strengthen the security or to improve the functionality of Our Service, or We are
                legally obligated to retain this data for longer time periods.
              </Para>
            </Section>

            <Section title="Transfer of Your Personal Data">
              <Para>
                Your information, including Personal Data, is processed at the Company's operating
                offices and in any other places where the parties involved in the processing are
                located. It means that this information may be transferred to — and maintained on —
                computers located outside of Your state, province, country or other governmental
                jurisdiction where the data protection laws may differ than those from Your
                jurisdiction.
              </Para>
              <Para>
                Your consent to this Privacy Policy followed by Your submission of such information
                represents Your agreement to that transfer.
              </Para>
            </Section>

            <Section title="Delete Your Personal Data">
              <Para>
                You have the right to delete or request that We assist in deleting the Personal Data
                that We have collected about You. Our Service may give You the ability to delete
                certain information about You from within the Service.
              </Para>
              <Para>
                You may update, amend, or delete Your information at any time by signing in to Your
                Account, if you have one, and visiting the account settings section that allows you
                to manage Your personal information. You may also contact Us to request access to,
                correct, or delete any personal information that You have provided to Us.
              </Para>
            </Section>

            <Section title="Disclosure of Your Personal Data">
              <Para bold>Business Transactions</Para>
              <Para>
                If the Company is involved in a merger, acquisition or asset sale, Your Personal Data
                may be transferred. We will provide notice before Your Personal Data is transferred
                and becomes subject to a different Privacy Policy.
              </Para>

              <Para bold>Law enforcement</Para>
              <Para>
                Under certain circumstances, the Company may be required to disclose Your Personal
                Data if required to do so by law or in response to valid requests by public
                authorities (e.g. a court or a government agency).
              </Para>

              <Para bold>Other legal requirements</Para>
              <Para>The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:</Para>
              <Bullet>Comply with a legal obligation</Bullet>
              <Bullet>Protect and defend the rights or property of the Company</Bullet>
              <Bullet>Prevent or investigate possible wrongdoing in connection with the Service</Bullet>
              <Bullet>Protect the personal safety of Users of the Service or the public</Bullet>
              <Bullet>Protect against legal liability</Bullet>
            </Section>

            <Section title="Security of Your Personal Data">
              <Para>
                The security of Your Personal Data is important to Us, but remember that no method of
                transmission over the Internet, or method of electronic storage is 100% secure. While
                We strive to use commercially acceptable means to protect Your Personal Data, We
                cannot guarantee its absolute security.
              </Para>
            </Section>

            <Section title="Children's Privacy">
              <Para>
                Our Service does not address anyone under the age of 13. We do not knowingly collect
                personally identifiable information from anyone under the age of 13. If You are a
                parent or guardian and You are aware that Your child has provided Us with Personal
                Data, please contact Us.
              </Para>
            </Section>

            <Section title="Links to Other Websites">
              <Para>
                Our Service may contain links to other websites that are not operated by Us. If You
                click on a third party link, You will be directed to that third party's site. We
                strongly advise You to review the Privacy Policy of every site You visit. We have no
                control over and assume no responsibility for the content, privacy policies or
                practices of any third party sites or services.
              </Para>
            </Section>

            <Section title="Changes to this Privacy Policy">
              <Para>
                We may update Our Privacy Policy from time to time. We will notify You of any changes
                by posting the new Privacy Policy on this page. We will let You know via email and/or
                a prominent notice on Our Service, prior to the change becoming effective and update
                the "Last updated" date at the top of this Privacy Policy.
              </Para>
            </Section>

            <Section title="Contact Us">
              <Para>
                If you have any questions about this Privacy Policy, You can contact us:
              </Para>
              <Bullet>
                By email:{' '}
                <Text
                  style={styles.link}
                  onPress={() => Linking.openURL('mailto:info@altunkaya.com')}
                >
                  info@altunkaya.com
                </Text>
              </Bullet>
              <Bullet>By phone: +90 342 357 0 357</Bullet>
              <Bullet>
                By visiting:{' '}
                <Text
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL('https://altunkayagroup.com/en/our-policies/')
                  }
                >
                  altunkayagroup.com/en/our-policies/
                </Text>
              </Bullet>
            </Section>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: { marginBottom: 10 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginTop: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37474F',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 6,
  },
  para: {
    fontSize: 13.5,
    color: '#444',
    lineHeight: 21,
    marginBottom: 10,
  },
  bold: {
    fontWeight: '700',
    color: '#333',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 14,
    color: '#546E7A',
    marginRight: 8,
    lineHeight: 21,
  },
  bulletText: {
    fontSize: 13.5,
    color: '#444',
    lineHeight: 21,
    flex: 1,
  },
  link: {
    color: '#1565C0',
    textDecorationLine: 'underline',
  },
});

