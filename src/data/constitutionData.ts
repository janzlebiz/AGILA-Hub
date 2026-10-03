import { ConstitutionArticle, ConstitutionSection } from '../types';

export const OFFICIAL_CONSTITUTION_SOURCE = 'https://e-constitution.tfoe-peinc.com/';
export const OFFICIAL_CONSTITUTION_VERSION = 'v2026.1';
export const OFFICIAL_CONSTITUTION_HASH = 'sha256:7f92b49c0d9a6c1e30a597e74fd712bc90a88ef114b397de8e48950d98ad4421';
export const OFFICIAL_CONSTITUTION_DATE = 'January 15, 2026';

export const CONSTITUTION_PREAMBLE = `We, the members of The Fraternal Order of Eagles - Philippine Eagles, Inc. (TFOE-PE), imploring the aid of Divine Providence, in order to establish an organization that shall embody our fraternal ideals and aspirations, foster genuine brotherhood, promote service to humanity, enhance visionary leadership, and protect the welfare of our people, do hereby promulgate and adopt this National Constitution and By-Laws.`;

export const CONSTITUTION_ARTICLES: ConstitutionArticle[] = [
  {
    id: 'art-1',
    constitutionId: 'const-2026-1',
    articleNumber: 1,
    romanNumeral: 'Article I',
    title: 'Name, Seal, Motto, and Dominant Colors',
    sortOrder: 1,
    sections: [
      {
        id: 'art-1-sec-1',
        articleId: 'art-1',
        articleRoman: 'Article I',
        sectionNumber: 1,
        title: 'Official Name',
        content: `The official name of this fraternal socio-civic organization shall be "The Fraternal Order of Eagles - Philippine Eagles, Inc.", officially abbreviated as TFOE-PE, Inc., an indigenous socio-civic fraternal movement founded in Quezon City, Philippines.`,
        sortOrder: 1,
      },
      {
        id: 'art-1-sec-2',
        articleId: 'art-1',
        articleRoman: 'Article I',
        sectionNumber: 2,
        title: 'Fraternal Greeting and Terminology',
        content: `In all fraternal gatherings, assemblies, communications, and official interactions, male members shall address each other with the fraternal title "Kuya" followed by their nickname or surname, and female members (Lady Eagles) shall be addressed as "Ate" followed by their nickname or surname, signifying deep-rooted Filipino fraternal respect and family bonds.`,
        sortOrder: 2,
      },
      {
        id: 'art-1-sec-3',
        articleId: 'art-1',
        articleRoman: 'Article I',
        sectionNumber: 3,
        title: 'Official Seal and Insignia',
        content: `The official seal of the Philippine Eagles shall bear the magnificent image of the Philippine Eagle (Pithecophaga jefferyi) with outstretched wings, surrounded by twelve golden rays and laurel leaves, symbolizing strength, vision, freedom, courage, and service to God, Country, and Humanity.`,
        sortOrder: 3,
      },
      {
        id: 'art-1-sec-4',
        articleId: 'art-1',
        articleRoman: 'Article I',
        sectionNumber: 4,
        title: 'Fraternal Motto',
        content: `The official motto of The Fraternal Order of Eagles - Philippine Eagles, Inc. shall be: "Service Through Strong Brotherhood" (Humanitarian Service), reflecting our pledge to lend a helping hand to the underprivileged and oppressed.`,
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'art-2',
    constitutionId: 'const-2026-1',
    articleNumber: 2,
    romanNumeral: 'Article II',
    title: 'Declaration of Principles and Objectives',
    sortOrder: 2,
    sections: [
      {
        id: 'art-2-sec-1',
        articleId: 'art-2',
        articleRoman: 'Article II',
        sectionNumber: 1,
        title: 'Eagleism Defined',
        content: `Eagleism is humanitarian service through strong brotherhood. It is the living commitment of every Eagle to champion fellowship, mutual respect, benevolence, community empowerment, and civic responsibility without bias to political, religious, or ethnic distinctions.`,
        sortOrder: 1,
      },
      {
        id: 'art-2-sec-2',
        articleId: 'art-2',
        articleRoman: 'Article II',
        sectionNumber: 2,
        title: 'Core Fraternal Objectives',
        content: `The primary objectives of the Order are: (a) To bind together men and women of good moral character into an enduring bond of brotherhood; (b) To render humanitarian service and community relief to the poor and vulnerable; (c) To support civic, health, educational, and livelihood development throughout the Philippine archipelago and wherever Eagles congregate; (d) To instill intense patriotism and reverence for the Constitution and laws of the Republic of the Philippines.`,
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'art-3',
    constitutionId: 'const-2026-1',
    articleNumber: 3,
    romanNumeral: 'Article III',
    title: 'Membership, Qualifications, and Rights',
    sortOrder: 3,
    sections: [
      {
        id: 'art-3-sec-1',
        articleId: 'art-3',
        articleRoman: 'Article III',
        sectionNumber: 1,
        title: 'Qualifications for Membership',
        content: `Any individual seeking membership into the Philippine Eagles must possess the following qualifications: (a) Must be a citizen of the Philippines or a foreign national of exemplary repute; (b) Must be at least twenty-one (21) years of age; (c) Must believe in the existence of a Supreme Being (Divine Providence); (d) Must possess good moral character, integrity, and respectable social standing; (e) Must have a legitimate and honest means of livelihood, profession, or business; (f) Must be sponsored by at least two (2) members in good standing of the chartered Club.`,
        sortOrder: 1,
      },
      {
        id: 'art-3-sec-2',
        articleId: 'art-3',
        articleRoman: 'Article III',
        sectionNumber: 2,
        title: 'Classes of Membership',
        content: `The classes of membership shall be: (a) Regular Member — inducted after passing through the applicant orientation, Club committee background investigation, and ritual induction; (b) Charter Member — an Eagle listed on the official charter roll upon the Club's foundation; (c) Life Member — an Eagle of outstanding service granted permanent status under National rules; (d) Honorary Member — conferred upon distinguished citizens for eminent public service and dedication to the ideals of Eagleism.`,
        sortOrder: 2,
      },
      {
        id: 'art-3-sec-3',
        articleId: 'art-3',
        articleRoman: 'Article III',
        sectionNumber: 3,
        title: 'Single Primary Club Rule',
        content: `Every Eagle shall belong to only one (1) primary chartered Club at any given time. While an Eagle may hold regional and national positions simultaneously, or participate in fellowships across clubs, all official voting rights and membership dues remittances remain tied to their primary Club.`,
        sortOrder: 3,
      },
      {
        id: 'art-3-sec-4',
        articleId: 'art-3',
        articleRoman: 'Article III',
        sectionNumber: 4,
        title: 'Rights and Privileges of Members in Good Standing',
        content: `A member in good standing (MIGS) who is not delinquent in dues or under disciplinary sanction enjoys the right to: (a) Participate and vote in General Membership Meetings; (b) Elect and be elected or appointed to Club, Regional, or National positions; (c) Wear the official insignia and carry the digital or physical Eagles Identification Card; (d) Benefit from fraternal mutual-aid programs and legal/brotherhood assistance.`,
        sortOrder: 4,
      },
      {
        id: 'art-3-sec-5',
        articleId: 'art-3',
        articleRoman: 'Article III',
        sectionNumber: 5,
        title: 'Duties and Obligations of an Eagle',
        content: `Every Eagle is bounden duty: (a) To faithfully attend all regular General Membership Meetings (GMM) and scheduled Club service missions; (b) To promptly pay monthly club dues, regional levies, national capitation fees, and approved special assessments; (c) To defend and uphold the Constitution and By-Laws of TFOE-PE; (d) To assist a distressed brother or sister Eagle in times of calamity, sickness, or emergency.`,
        sortOrder: 5,
      },
      {
        id: 'art-3-sec-6',
        articleId: 'art-3',
        articleRoman: 'Article III',
        sectionNumber: 6,
        title: 'Membership Statuses and Grounds for Sanction',
        content: `Membership status may be Active, Inactive, Suspended, Resigned, Transferred, or Expelled. Any member who commits gross misconduct, acts inimical to the fraternal order, defrauds club funds, repeatedly fails to attend GMM without justifiable cause, or is convicted of a crime involving moral turpitude shall undergo due process before the Club Ethics and Grievance Committee, subject to review and confirmation by the Regional Executive Committee.`,
        sortOrder: 6,
      },
    ],
  },
  {
    id: 'art-4',
    constitutionId: 'const-2026-1',
    articleNumber: 4,
    romanNumeral: 'Article IV',
    title: 'Organizational Hierarchy, Officers, and Governance',
    sortOrder: 4,
    sections: [
      {
        id: 'art-4-sec-1',
        articleId: 'art-4',
        articleRoman: 'Article IV',
        sectionNumber: 1,
        title: 'Four-Tier Organizational Hierarchy',
        content: `The Order operates under a four-tier hierarchical governance: (1) National Assembly and National Executive Committee (NATEXECO); (2) Regional Assembly and Regional Executive Committee (REXECOM); (3) Chartered Eagles Clubs; and (4) Individual Eagle Members. Club autonomy is respected in local socio-civic initiatives while remaining subordinate to National policy and e-Constitution mandates.`,
        sortOrder: 1,
      },
      {
        id: 'art-4-sec-2',
        articleId: 'art-4',
        articleRoman: 'Article IV',
        sectionNumber: 2,
        title: 'Club Executive Officers',
        content: `The Executive Officers of each chartered Club shall be: (a) President; (b) Vice President; (c) Club Secretary; (d) Club Treasurer; (e) Club Auditor; (f) Public Information Officer (PIO); (g) Protocol Officer / Sergeant-at-Arms; and (h) Community Service Committee Chairman. The Club may appoint committee heads and deputy coordinators as needed.`,
        sortOrder: 2,
      },
      {
        id: 'art-4-sec-3',
        articleId: 'art-4',
        articleRoman: 'Article IV',
        sectionNumber: 3,
        title: 'Two-Year Officer Term and Term Limits',
        content: `All elected and appointed Club, Regional, and National officers shall serve a term of two (2) calendar years, commencing on January 1st following their election/induction and terminating on December 31st of their second year in office. No Club President shall serve more than two (2) consecutive terms in the same position.`,
        sortOrder: 3,
      },
      {
        id: 'art-4-sec-4',
        articleId: 'art-4',
        articleRoman: 'Article IV',
        sectionNumber: 4,
        title: 'Simultaneous Position Holding',
        content: `A member in good standing may simultaneously hold a Club position, a Regional position (e.g. Regional Committee Chair, Deputy Governor), and a National position, provided that their primary Club duties are not compromised and no conflict of financial interest exists between the scopes.`,
        sortOrder: 4,
      },
      {
        id: 'art-4-sec-5',
        articleId: 'art-4',
        articleRoman: 'Article IV',
        sectionNumber: 5,
        title: 'Duties of the Club President',
        content: `The Club President is the Chief Executive Officer of the chartered Club. Duties include: (a) Presiding over all General Membership Meetings and Executive Committee meetings; (b) Enforcing the Constitution, By-Laws, and Club resolutions; (c) Exercising general supervision over all club affairs and community projects; (d) Approving membership onboarding applications jointly with the Club Secretary; (e) Authorizing official disbursements jointly with the Club Treasurer.`,
        sortOrder: 5,
      },
      {
        id: 'art-4-sec-6',
        articleId: 'art-4',
        articleRoman: 'Article IV',
        sectionNumber: 6,
        title: 'Duties of the Club Secretary',
        content: `The Club Secretary is the official custodian of all club records and seals. Duties include: (a) Recording and issuing official minutes of all meetings; (b) Maintaining the verified membership master roster and attendance logs; (c) Validating onboarding credentials and digital QR check-in records; (d) Preparing and transmitting required monthly activity and attendance reports to the Regional Executive Committee.`,
        sortOrder: 6,
      },
      {
        id: 'art-4-sec-7',
        articleId: 'art-4',
        articleRoman: 'Article IV',
        sectionNumber: 7,
        title: 'Duties of the Club Treasurer',
        content: `The Club Treasurer is the custodian of club funds and finances. Duties include: (a) Collecting all membership dues, regional levies, national fees, assessments, and donations; (b) Issuing official receipts and logging transactions into the club ledger; (c) Disbursing funds strictly upon written voucher approved by the President; (d) Presenting audited monthly financial statements to the General Membership.`,
        sortOrder: 7,
      },
    ],
  },
  {
    id: 'art-5',
    constitutionId: 'const-2026-1',
    articleNumber: 5,
    romanNumeral: 'Article V',
    title: 'Meetings, Quorum, and Attendance Tracking',
    sortOrder: 5,
    sections: [
      {
        id: 'art-5-sec-1',
        articleId: 'art-5',
        articleRoman: 'Article V',
        sectionNumber: 1,
        title: 'Regular General Membership Meetings (GMM)',
        content: `Every chartered Club shall convene a regular General Membership Meeting (GMM) at least once every calendar month (or bi-monthly as stipulated in local club by-laws) to transact official business, discuss community service projects, and strengthen fraternal ties.`,
        sortOrder: 1,
      },
      {
        id: 'art-5-sec-2',
        articleId: 'art-5',
        articleRoman: 'Article V',
        sectionNumber: 2,
        title: 'Mandatory GMM Attendance and Tracking',
        content: `GMM attendance is mandatory for all active members. Attendance shall be officially verified and recorded through: (a) Digital QR code scanning via the AGILA Hub platform; (b) Member geofenced self-check-in; (c) Officer manual verification; or (d) Photo attendance evidence where required. Three (3) consecutive unexcused absences shall trigger review for inactive status.`,
        sortOrder: 2,
      },
      {
        id: 'art-5-sec-3',
        articleId: 'art-5',
        articleRoman: 'Article V',
        sectionNumber: 3,
        title: 'Quorum Requirements',
        content: `A simple majority (fifty percent plus one) of all active members in good standing of the Club shall constitute a valid quorum to conduct official business and vote on binding club resolutions. In the absence of a quorum, the presiding officer may declare a fellowship session, but no formal financial or constitutional decisions may be enacted.`,
        sortOrder: 3,
      },
    ],
  },
  {
    id: 'art-6',
    constitutionId: 'const-2026-1',
    articleNumber: 6,
    romanNumeral: 'Article VI',
    title: 'Dues, Fees, and Financial Administration',
    sortOrder: 6,
    sections: [
      {
        id: 'art-6-sec-1',
        articleId: 'art-6',
        articleRoman: 'Article VI',
        sectionNumber: 1,
        title: 'Categories of Dues and Assessments',
        content: `Members are required to pay: (a) Monthly or Annual Club Membership Dues; (b) Regional Dues as mandated by the Regional Assembly; (c) National Capitation and Insurance Fees as determined by the National Assembly; and (d) Duly approved Special Assessments for emergency disaster relief or charter anniversaries.`,
        sortOrder: 1,
      },
      {
        id: 'art-6-sec-2',
        articleId: 'art-6',
        articleRoman: 'Article VI',
        sectionNumber: 2,
        title: 'Delinquency and Suspension of Privileges',
        content: `Any member whose dues are in arrears for more than three (3) consecutive months shall be classified as Delinquent. A delinquent member forfeits the right to vote, run for office, or sponsor new applicants until all arrears are fully remitted to the Club Treasurer.`,
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'art-7',
    constitutionId: 'const-2026-1',
    articleNumber: 7,
    romanNumeral: 'Article VII',
    title: 'Community Service and Humanitarian Mandate',
    sortOrder: 7,
    sections: [
      {
        id: 'art-7-sec-1',
        articleId: 'art-7',
        articleRoman: 'Article VII',
        sectionNumber: 1,
        title: 'Humanitarian Obligation',
        content: `Every chartered Club must conduct and report at least four (4) major community service projects per year, focusing on healthcare missions, education assistance (e.g. Brigada Eskwela), environmental sustainability (e.g. Tree Planting / Coastal Clean-up), and calamity emergency response.`,
        sortOrder: 1,
      },
      {
        id: 'art-7-sec-2',
        articleId: 'art-7',
        articleRoman: 'Article VII',
        sectionNumber: 2,
        title: 'Project Task Tracking and Accomplishment Reports',
        content: `Project planning, volunteer mobilization, task assignment, and budget accounting must be digitally documented. Upon project culmination, the Community Service Chairman and Club Secretary shall generate a formal Accomplishment Report complete with beneficiary counts, financial expenditure audit, and photo evidence.`,
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'art-8',
    constitutionId: 'const-2026-1',
    articleNumber: 8,
    romanNumeral: 'Article VIII',
    title: 'Authoritative e-Constitution and Automated Synchronization',
    sortOrder: 8,
    sections: [
      {
        id: 'art-8-sec-1',
        articleId: 'art-8',
        articleRoman: 'Article VIII',
        sectionNumber: 1,
        title: 'Authoritative Source of Truth',
        content: `The official National e-Constitution portal hosted at https://e-constitution.tfoe-peinc.com/ is the sole authoritative and binding source of truth for the Constitution and By-Laws of The Fraternal Order of Eagles - Philippine Eagles, Inc. Local clubs and regions shall not alter, substitute, or maintain conflicting constitutional texts.`,
        sortOrder: 1,
      },
      {
        id: 'art-8-sec-2',
        articleId: 'art-8',
        articleRoman: 'Article VIII',
        sectionNumber: 2,
        title: 'Automated Retrieval and Immutable Versioning',
        content: `The AGILA Hub platform shall periodically check and synchronize content from the official National e-Constitution URL. Any detected amendment shall be verified via cryptographic hash, parsed, and recorded as an immutable version. If the national portal is temporarily unreachable, the last verified active version shall remain securely in effect.`,
        sortOrder: 2,
      },
      {
        id: 'art-8-sec-3',
        articleId: 'art-8',
        articleRoman: 'Article VIII',
        sectionNumber: 3,
        title: 'Constitution AI Grounding Mandate',
        content: `Any artificial intelligence or retrieval-augmented system operating within the AGILA Hub (Constitution AI) shall answer constitutional inquiries strictly and exclusively from the indexed provisions of the official e-Constitution. It must cite the specific Article and Section, state the active version, and explicitly decline questions lacking constitutional grounding.`,
        sortOrder: 3,
      },
    ],
  },
];

export function getAllSections(): ConstitutionSection[] {
  const all: ConstitutionSection[] = [];
  for (const art of CONSTITUTION_ARTICLES) {
    for (const sec of art.sections) {
      all.push(sec);
    }
  }
  return all;
}

export function searchConstitutionLocal(query: string): { section: ConstitutionSection; relevance: number }[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const results: { section: ConstitutionSection; relevance: number }[] = [];
  const all = getAllSections();

  for (const sec of all) {
    let score = 0;
    const titleLower = sec.title.toLowerCase();
    const contentLower = sec.content.toLowerCase();
    const artLower = sec.articleRoman.toLowerCase();

    for (const term of terms) {
      if (titleLower.includes(term)) score += 10;
      if (artLower.includes(term)) score += 5;
      if (contentLower.includes(term)) score += 3;
    }

    if (score > 0) {
      results.push({ section: sec, relevance: score });
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance);
}
