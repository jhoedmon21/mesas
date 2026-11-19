/* GENERADO por scripts/locales-zona.mjs — no editar a mano.
   Locales de votación de Cerro Colorado georreferenciados (OSM) y asignados a la
   asociación más cercana, con los códigos de acta que les corresponden en la
   captura de ONPE. 39 locales · 451 actas.
   Permiten que cada mesa del modelo se apoye en un local real en vez de un
   punto aleatorio dentro del polígono. */

export interface LocalMesa {
  zonaId: string;
  codigo: number;
  nombre: string;
  position: [number, number];
  actas: string[];
  /** ONPE ubica el local en Cerro Colorado aunque el anillo OSM lo deje fuera. */
  dentroDistrito?: boolean;
}

export const LOCALES: LocalMesa[] = [
  { zonaId: "apipa-i", codigo: 605, nombre: "IE 40103 LIBERTADORES DE AMERICA", position: [-71.574404, -16.350996], actas: ["005783", "005784", "005785", "005786", "005787", "005788", "005789", "005790", "005791", "005792", "005793", "005794", "005795", "005796", "005797", "005798"] },
  { zonaId: "apipa-iii", codigo: 608, nombre: "IE 40055 ROMEO LUNA VICTORIA", position: [-71.564703, -16.353063], actas: ["005820", "005821", "005822", "005823", "005824", "005825", "005826", "005827", "005828", "005829", "005830", "005831", "005832", "005833", "005834"] },
  { zonaId: "apipa-x", codigo: 8705, nombre: "IE 40035 VICTOR ANDRES BELAUNDE", position: [-71.560593, -16.349121], actas: ["006099", "006100", "006101", "006102", "006103", "006104", "006105", "006106", "006107", "006108", "006109", "006110", "006111"] },
  { zonaId: "apipa-xvi", codigo: 598, nombre: "IE 40670 EL EDEN FE Y ALEGRIA 51", position: [-71.556476, -16.325411], actas: ["005737", "005738", "005739", "005740", "005741", "005742", "005743", "005744", "005745", "005746", "005747", "005748", "005749", "005750", "005751", "005752"] },
  { zonaId: "apipa-xvi", codigo: 51026, nombre: "IE CRISTO REY CIRCA", position: [-71.548558, -16.325508], actas: ["006033", "006034", "006035", "006036", "006037", "006038", "006039", "006040", "006041", "006042", "006043", "006044", "006045"], dentroDistrito: true },
  { zonaId: "apipa-xvi", codigo: 51028, nombre: "IE SAN JUAN APOSTOL", position: [-71.547378, -16.312231], actas: ["006052", "006053", "006054", "006055", "006056", "006057", "006058", "006059", "006060", "006061", "006062", "006063", "006064", "006065", "006066", "006067"] },
  { zonaId: "apipa-xvi", codigo: 8728, nombre: "IEP INTERNACIONAL JOHANNES KEPLER", position: [-71.552771, -16.315742], actas: ["006134", "006135", "006136", "006137", "006138", "006139", "006140", "006141"] },
  { zonaId: "apipa-xvi", codigo: 8729, nombre: "IEP JESUS MAESTRO", position: [-71.5557, -16.328392], actas: ["006142", "006143", "006144", "006145", "006146", "006147", "006148", "006149"] },
  { zonaId: "apipa-xvi", codigo: 8730, nombre: "IEP JESUS MAESTRO I", position: [-71.5557, -16.328392], actas: ["006150", "006151", "006152", "006153", "006154", "006155", "006156", "006157", "006158", "006159", "006160"] },
  { zonaId: "apipa-xvi", codigo: 30910, nombre: "IEP JOHN FORBES", position: [-71.563367, -16.326397], actas: ["005881", "005882", "005883", "005884", "005885", "005886", "005887", "005888", "005889", "005890", "005891", "005892", "005893"] },
  { zonaId: "apipa-xvi", codigo: 32817, nombre: "IEP TALENTS SCHOOL", position: [-71.55084, -16.315812], actas: ["005998", "005999", "006000", "006001", "006002", "006003", "006004"] },
  { zonaId: "apipa-xviii", codigo: 8745, nombre: "IE SAN JOSE DE COTTOLENGO CIRCA", position: [-71.573399, -16.32881], actas: ["006179", "006180", "006181", "006182", "006183", "006184", "006185", "006186", "006187", "006188", "006189", "006190", "006191", "006192", "006193", "006194"] },
  { zonaId: "apipa-xviii", codigo: 31860, nombre: "IEP SAN FRANCISCO DE SALES", position: [-71.567009, -16.319358], actas: ["005941", "005942", "005943", "005944", "005945", "005946", "005947"] },
  { zonaId: "apipa-xviii", codigo: 32816, nombre: "IEP SAN FRANCISCO DE SALES AREQUIPA NORTE", position: [-71.566396, -16.320795], actas: ["005989", "005990", "005991", "005992", "005993", "005994", "005995", "005996", "005997"] },
  { zonaId: "cerro-viejo", codigo: 8727, nombre: "IEP ILUMINADORA VIRGEN DEL CARMEN", position: [-71.632601, -16.355006], actas: ["006129", "006130", "006131", "006132", "006133"] },
  { zonaId: "ciudad-municipal", codigo: 599, nombre: "IE 41025 200 MILLAS PERUANAS", position: [-71.562136, -16.374742], actas: ["005753", "005754", "005755", "005756", "005757", "005758", "005759"] },
  { zonaId: "ciudad-municipal", codigo: 31856, nombre: "IEP BRUNING HANS HEIMBRICH", position: [-71.559375, -16.374235], actas: ["005917", "005918", "005919", "005920", "005921", "005922", "005923", "005924", "005925", "005926", "005927"] },
  { zonaId: "rio-seco", codigo: 594, nombre: "IE 40044 SAN MARTIN DE PORRES", position: [-71.592815, -16.322869], actas: ["005689", "005690", "005691", "005692", "005693", "005694", "005695", "005696", "005697", "005698", "005699", "005700", "005701", "005702", "005703"] },
  { zonaId: "rio-seco", codigo: 20260, nombre: "IE 40671 VILLA SAN JUAN", position: [-71.585666, -16.335633], actas: ["005858", "005859", "005860", "005861", "005862", "005863"] },
  { zonaId: "rio-seco", codigo: 7066, nombre: "IE 40677 SAN MIGUEL FEBRES CORDERO", position: [-71.581384, -16.335077], actas: ["006092", "006093", "006094", "006095", "006096", "006097", "006098"] },
  { zonaId: "rio-seco", codigo: 17024, nombre: "IE 40689 ALFREDO RODRIGUEZ BALLON", position: [-71.585571, -16.330907], actas: ["005835", "005836", "005837", "005838", "005839", "005840", "005841", "005842"] },
  { zonaId: "rio-seco", codigo: 51229, nombre: "IE CASA DE CARIDAD ARTES Y OFICIOS", position: [-71.579638, -16.329518], actas: ["006068", "006069", "006070", "006071", "006072", "006073", "006074", "006075", "006076", "006077", "006078"] },
  { zonaId: "rio-seco", codigo: 20269, nombre: "IE CRISTO MORADO", position: [-71.587255, -16.318954], actas: ["005864", "005865", "005866", "005867", "005868"] },
  { zonaId: "rio-seco", codigo: 20276, nombre: "IE JOSE LUIS BUSTAMANTE Y RIVERO", position: [-71.604576, -16.340097], actas: ["005869", "005870", "005871", "005872", "005873", "005874", "005875", "005876", "005877", "005878", "005879", "005880"] },
  { zonaId: "rio-seco", codigo: 30914, nombre: "IE SAN PIO X CIRCA", position: [-71.584231, -16.326033], actas: ["005894", "005895", "005896", "005897", "005898", "005899", "005900", "005901", "005902", "005903", "005904", "005905", "005906", "005907", "005908", "005909"] },
  { zonaId: "rio-seco", codigo: 17896, nombre: "IEP ALEXANDER FRIEDMAN", position: [-71.593504, -16.324809], actas: ["005843", "005844", "005845", "005846", "005847", "005848", "005849", "005850", "005851", "005852", "005853", "005854", "005855", "005856", "005857"] },
  { zonaId: "rio-seco", codigo: 32813, nombre: "IEP HOLY SCHOOLS", position: [-71.604093, -16.323407], actas: ["005973", "005974", "005975", "005976", "005977", "005978", "005979", "005980", "005981", "005982", "005983", "005984", "005985", "005986", "005987", "005988"] },
  { zonaId: "rio-seco", codigo: 31858, nombre: "IEP LAS PLUMAS DEL AMAUTA", position: [-71.610686, -16.339158], actas: ["005928", "005929", "005930", "005931", "005932", "005933", "005934", "005935", "005936", "005937", "005938", "005939", "005940"] },
  { zonaId: "rio-seco", codigo: 30920, nombre: "IEP LEONARDO DA VINCI", position: [-71.612202, -16.340903], actas: ["005910", "005911", "005912", "005913", "005914", "005915", "005916"] },
  { zonaId: "rio-seco", codigo: 8735, nombre: "IEP SABIO ALFRED BINET", position: [-71.586212, -16.32945], actas: ["006161", "006162", "006163", "006164", "006165", "006166", "006167", "006168", "006169", "006170", "006171", "006172"] },
  { zonaId: "rio-seco", codigo: 31862, nombre: "IEP SEÑOR DE LA CAÑA", position: [-71.6037, -16.335], actas: ["005948", "005949", "005950", "005951", "005952", "005953", "005954", "005955", "005956"] },
  { zonaId: "rio-seco", codigo: 32111, nombre: "IEP STEPHEN WILLIAM HAWKING", position: [-71.578601, -16.326084], actas: ["005957", "005958", "005959", "005960", "005961", "005962", "005963"] },
  { zonaId: "rio-seco", codigo: 52047, nombre: "IEPC THOMAS MC III", position: [-71.599104, -16.323021], actas: ["006079", "006080", "006081", "006082", "006083", "006084", "006085", "006086", "006087", "006088", "006089", "006090", "006091"] },
  { zonaId: "sor-ana", codigo: 595, nombre: "IE 40054 JUAN DOMINGO ZAMACOLA Y JAUREGUI", position: [-71.56299, -16.380701], actas: ["005704", "005705", "005706", "005707", "005708", "005709", "005710", "005711", "005712", "005713", "005714", "005715", "005716", "005717", "005718", "005719", "005720", "005721", "005722", "005723", "005724", "005725", "005726", "005727", "005728", "005729", "005730", "005731", "005732", "005733", "005734", "005735", "005736"] },
  { zonaId: "sor-ana", codigo: 602, nombre: "IE 40058 IGNACIO ALVAREZ THOMAS", position: [-71.570787, -16.380697], actas: ["005775", "005776", "005777", "005778", "005779", "005780", "005781", "005782"] },
  { zonaId: "sor-ana", codigo: 600, nombre: "IE 41026 MARIA MURILLO DE BERNAL", position: [-71.561107, -16.377168], actas: ["005760", "005761", "005762", "005763", "005764", "005765", "005766", "005767", "005768"] },
  { zonaId: "villa-cerrillos", codigo: 32707, nombre: "IEP GRUPO BALMER SAC", position: [-71.553531, -16.380732], actas: ["005964", "005965", "005966", "005967", "005968", "005969", "005970", "005971", "005972"] },
  { zonaId: "zamacola", codigo: 607, nombre: "IE SANTO TOMAS DE AQUINO", position: [-71.567391, -16.39335], actas: ["005799", "005800", "005801", "005802", "005803", "005804", "005805", "005806", "005807", "005808", "005809", "005810", "005811", "005812", "005813", "005814", "005815", "005816", "005817", "005818", "005819"] },
  { zonaId: "zamacola", codigo: 40086, nombre: "IEP LA SAGRADA FAMILIA DE APIPA", position: [-71.569005, -16.400728], actas: ["006005", "006006", "006007", "006008", "006009", "006010", "006011", "006012"] },
];

export const LOCALES_POR_CODIGO = new Map<number, LocalMesa>(
  LOCALES.map((local) => [local.codigo, local]),
);

export const LOCALES_POR_ZONA = new Map<string, LocalMesa[]>();
for (const local of LOCALES) {
  const lista = LOCALES_POR_ZONA.get(local.zonaId) ?? [];
  lista.push(local);
  LOCALES_POR_ZONA.set(local.zonaId, lista);
}
