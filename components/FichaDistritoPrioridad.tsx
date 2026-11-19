import {
  DISTRITOS_POR_POZO,
  RESUMEN_DISTRITOS,
  type DistritoPrioridad,
} from "@/data/distritosPrioridad";
import { FUENTE_ELECTORAL } from "@/data/electoralArequipa2026";
import { mesasDeDistrito, resumenMesas } from "@/data/mesasDistritos";
import { perfilDeDistrito, planDeJornadas } from "@/lib/distrito";
import { fmtDec, fmtInt } from "@/lib/format";

const TH: React.CSSProperties = {
  padding: "3px 4px",
  fontSize: 6.8,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#64748b",
  textAlign: "left",
  borderBottom: "1px solid #cbd5e1",
};

const TD: React.CSSProperties = {
  padding: "2.2px 4px",
  fontSize: 8.1,
  lineHeight: 1.25,
  borderBottom: "1px solid #e2e8f0",
  verticalAlign: "top",
};

function Kpi({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: 6,
        padding: "6px 7px",
        background: "#f8fafc",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 6.8,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#64748b",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "2px 0 0",
          fontSize: 15,
          fontWeight: 800,
          lineHeight: 1,
          color: color ?? "#0f172a",
        }}
      >
        {value}
      </p>
      {detail && (
        <p style={{ margin: "2px 0 0", fontSize: 7.2, color: "#64748b" }}>
          {detail}
        </p>
      )}
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 4px",
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: "#0e7490",
        fontWeight: 700,
      }}
    >
      {children}
    </p>
  );
}

export default function FichaDistritoPrioridad({
  distrito,
}: {
  distrito: DistritoPrioridad;
}) {
  const perfil = perfilDeDistrito(distrito.id);
  const mesas = resumenMesas(mesasDeDistrito(distrito.id));
  const plan = planDeJornadas(distrito.meta10);
  const rival = perfil?.rivalMasCercano ?? null;
  const zegarraPct = perfil?.validos
    ? (perfil.zegarraVotos / perfil.validos) * 100
    : 0;
  const huisaPct = perfil?.validos
    ? (perfil.huisaVotos / perfil.validos) * 100
    : 0;

  return (
    <article
      className="ficha-print"
      style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
      aria-hidden="true"
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2px solid #0e7490",
          paddingBottom: 8,
          marginBottom: 10,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 8,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0e7490",
              fontWeight: 700,
            }}
          >
            Cerreño 3D · Ficha de prioridad distrital
          </p>
          <h1 style={{ margin: "3px 0 0", fontSize: 22, lineHeight: 1.1 }}>
            {distrito.nombre}
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 9.5, color: "#475569" }}>
            Provincia de {distrito.provincia} · puesto {distrito.puesto} de 15
            por pozo · {fmtInt(mesas.mesas)} mesas con acta en{" "}
            {fmtInt(mesas.locales)} locales
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: 8, color: "#64748b" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>
            {FUENTE_ELECTORAL.eleccion}
          </p>
          <p style={{ margin: "2px 0 0" }}>
            {FUENTE_ELECTORAL.actas} · {FUENTE_ELECTORAL.fecha}
          </p>
          <p style={{ margin: "2px 0 0" }}>Balotaje: 06 dic 2026</p>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 5,
          marginBottom: 7,
        }}
      >
        <Kpi
          label="Votos válidos"
          value={fmtInt(distrito.validos)}
          detail={`${fmtInt(distrito.zegarraVotos)} de Zegarra`}
        />
        <Kpi
          label="Zegarra"
          value={`${fmtDec(distrito.zegarraPct)}%`}
          detail="sobre válidos"
          color="#0e7490"
        />
        <Kpi
          label="Margen Zegarra − Huisa"
          value={`${distrito.margen >= 0 ? "+" : "−"}${fmtDec(Math.abs(distrito.margen))} pp`}
          detail={`${fmtInt(distrito.huisaVotos)} votos Huisa`}
          color={distrito.margen >= 0 ? "#047857" : "#b91c1c"}
        />
        <Kpi
          label="Meta +10 pp"
          value={distrito.meta10 > 0 ? `+${fmtInt(distrito.meta10)}` : "0"}
          detail={
            distrito.meta10 > 0
              ? "netos que faltan"
              : "el margen ya supera +10 pp"
          }
          color={distrito.meta10 > 0 ? "#b45309" : "#047857"}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 5,
          marginBottom: 7,
        }}
      >
        <Kpi
          label="Pozo otras candidaturas"
          value={fmtInt(distrito.pozo)}
          detail="votos que no son de Zegarra ni Huisa"
          color="#b45309"
        />
        <Kpi
          label="5% del pozo"
          value={fmtInt(distrito.pozo5)}
          detail="primer tramo verificable"
          color="#0e7490"
        />
        <Kpi
          label="Peso del pozo"
          value={
            distrito.validos
              ? `${fmtDec((distrito.pozo / distrito.validos) * 100)}%`
              : "—"
          }
          detail="sobre los válidos del distrito"
        />
      </div>

      <p
        style={{
          margin: "0 0 8px",
          fontSize: 8.5,
          lineHeight: 1.45,
          color: "#334155",
          borderLeft: "3px solid #f59e0b",
          paddingLeft: 7,
        }}
      >
        <strong>Lectura.</strong> {distrito.nombre} ocupa el puesto{" "}
        {distrito.puesto} de 15 por volumen de pozo:{" "}
        {fmtInt(distrito.pozo)} votos de otras candidaturas.{" "}
        {plan.total > 0
          ? `Para llevar el margen local a +10 pp faltan ${fmtInt(distrito.meta10)} votos netos, que son ${fmtInt(plan.porJornada)} por jornada en las ${plan.jornadas} que quedan.`
          : `El margen local ya supera +10 pp: la tarea es defenderlo, no ampliarlo.`}{" "}
        El primer tramo de trabajo es captar {fmtInt(distrito.pozo5)} votos, el
        5% del pozo.
        {rival
          ? ` El rival más cercano en este distrito es ${rival.corto}: Zegarra ${rival.gana ? "gana" : "pierde"} por ${fmtInt(Math.abs(rival.diferencia))} votos (${fmtDec(Math.abs(rival.margen))} pp).`
          : ""}{" "}
        Las cifras no son una proyección: es aritmética sobre los válidos del
        distrito.
      </p>

      {perfil ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 7,
            }}
          >
            <div>
              <Titulo>Los 15 en {distrito.nombre}</Titulo>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH}>#</th>
                    <th style={TH}>Candidatura</th>
                    <th style={{ ...TH, textAlign: "right" }}>Votos</th>
                    <th style={{ ...TH, textAlign: "right" }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {perfil.ranking.map((f) => (
                    <tr
                      key={f.id}
                      style={
                        f.esZegarra
                          ? { background: "#ecfeff", fontWeight: 700 }
                          : f.esHuisa
                            ? { background: "#fff1f2" }
                            : undefined
                      }
                    >
                      <td style={{ ...TD, width: 14 }}>{f.puesto}</td>
                      <td style={TD}>{f.corto}</td>
                      <td style={{ ...TD, textAlign: "right" }}>
                        {fmtInt(f.votos)}
                      </td>
                      <td
                        style={{
                          ...TD,
                          textAlign: "right",
                          color: "#475569",
                        }}
                      >
                        {fmtDec(f.pct)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ margin: "3px 0 0", fontSize: 6.8, color: "#64748b" }}>
                Matriz ONPE de 15 candidaturas · {fmtInt(perfil.validos)}{" "}
                válidos.
              </p>
            </div>

            <div>
              <Titulo>Frente a los 14 rivales</Titulo>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH}>Rival</th>
                    <th style={{ ...TH, textAlign: "right" }}>Votos</th>
                    <th style={{ ...TH, textAlign: "right" }}>Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {perfil.frentes.map((f) => (
                    <tr key={f.id}>
                      <td style={TD}>{f.corto}</td>
                      <td style={{ ...TD, textAlign: "right" }}>
                        {fmtInt(f.votos)}
                      </td>
                      <td
                        style={{
                          ...TD,
                          textAlign: "right",
                          fontWeight: 700,
                          color: f.gana ? "#047857" : "#b91c1c",
                        }}
                      >
                        {f.gana ? "+" : "−"}
                        {fmtDec(Math.abs(f.margen))} pp
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ margin: "3px 0 0", fontSize: 6.8, color: "#64748b" }}>
                Ordenado por cercanía · margen Zegarra − rival sobre los válidos.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.15fr 1fr",
              gap: 10,
              marginBottom: 7,
              borderTop: "1px solid #e2e8f0",
              paddingTop: 7,
            }}
          >
            <div>
              <Titulo>Composición del voto</Titulo>
              <div
                style={{
                  display: "flex",
                  height: 8,
                  borderRadius: 4,
                  overflow: "hidden",
                  background: "#e2e8f0",
                }}
              >
                <span style={{ width: `${zegarraPct}%`, background: "#0891b2" }} />
                <span style={{ width: `${huisaPct}%`, background: "#e11d48" }} />
                <span
                  style={{
                    width: `${perfil.pozoPct}%`,
                    background: "#f59e0b",
                  }}
                />
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 7.5, color: "#475569" }}>
                Zegarra {fmtDec(zegarraPct)}% · Huisa {fmtDec(huisaPct)}% · pozo{" "}
                {fmtDec(perfil.pozoPct)}%
              </p>
              <p style={{ margin: "5px 0 0", fontSize: 7.8, color: "#334155" }}>
                Las tres primeras candidaturas del pozo —{" "}
                {perfil.pozoFilas
                  .slice(0, 3)
                  .map((f) => `${f.corto} (${fmtInt(f.votos)})`)
                  .join(", ")}
                — concentran {fmtDec(perfil.concentracionPozo)}% de los{" "}
                {fmtInt(perfil.pozo)} votos en disputa.
              </p>
            </div>

            <div>
              <Titulo>Plan de {plan.jornadas} jornadas</Titulo>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={TD}>Meta neta a +10 pp</td>
                    <td
                      style={{
                        ...TD,
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#b45309",
                      }}
                    >
                      {plan.total > 0 ? `+${fmtInt(plan.total)}` : "0"}
                    </td>
                  </tr>
                  <tr>
                    <td style={TD}>Por jornada ({plan.jornadas} días)</td>
                    <td style={{ ...TD, textAlign: "right", fontWeight: 700 }}>
                      {plan.total > 0 ? `+${fmtInt(plan.porJornada)}` : "defender"}
                    </td>
                  </tr>
                  <tr>
                    <td style={TD}>Primer tramo (5% del pozo)</td>
                    <td style={{ ...TD, textAlign: "right" }}>
                      {fmtInt(distrito.pozo5)}
                    </td>
                  </tr>
                  <tr>
                    <td style={TD}>Actas contabilizadas</td>
                    <td style={{ ...TD, textAlign: "right" }}>
                      {distrito.actas === null || distrito.totalActas === null
                        ? "sin dato"
                        : `${fmtInt(distrito.actas)} / ${fmtInt(distrito.totalActas)}`}
                    </td>
                  </tr>
                  <tr>
                    <td style={TD}>Participación</td>
                    <td style={{ ...TD, textAlign: "right" }}>
                      {distrito.participacion === null
                        ? "sin dato"
                        : `${fmtDec(distrito.participacion)}%`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <p
          style={{
            margin: "0 0 9px",
            fontSize: 8.2,
            lineHeight: 1.45,
            color: "#334155",
            borderLeft: "3px solid #94a3b8",
            paddingLeft: 7,
          }}
        >
          <strong>Sin matriz de candidaturas.</strong> {distrito.nombre} está
          fuera de la provincia de Arequipa, y la matriz de 15 candidaturas solo
          cubre los 29 distritos de esa provincia. Los totales de pozo y válidos
          provienen de la tabla de priorización; no se desagregan por candidatura
          ni por sección.
        </p>
      )}

      <p
        style={{
          margin: "0 0 4px",
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#0e7490",
          fontWeight: 700,
        }}
      >
        Los 15 distritos por pozo
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={TH}>#</th>
            <th style={TH}>Distrito</th>
            <th style={TH}>Provincia</th>
            <th style={{ ...TH, textAlign: "right" }}>Válidos</th>
            <th style={{ ...TH, textAlign: "right" }}>Pozo</th>
            <th style={{ ...TH, textAlign: "right" }}>Zegarra</th>
            <th style={{ ...TH, textAlign: "right" }}>Margen</th>
            <th style={{ ...TH, textAlign: "right" }}>5% pozo</th>
            <th style={{ ...TH, textAlign: "right" }}>Meta +10</th>
          </tr>
        </thead>
        <tbody>
          {DISTRITOS_POR_POZO.map((d) => (
            <tr
              key={d.id}
              style={
                d.id === distrito.id
                  ? { background: "#ecfeff", fontWeight: 700 }
                  : undefined
              }
            >
              <td style={TD}>{d.puesto}</td>
              <td style={TD}>{d.nombre}</td>
              <td style={{ ...TD, color: "#64748b" }}>{d.provincia}</td>
              <td style={{ ...TD, textAlign: "right" }}>{fmtInt(d.validos)}</td>
              <td
                style={{
                  ...TD,
                  textAlign: "right",
                  color: "#b45309",
                  fontWeight: 700,
                }}
              >
                {fmtInt(d.pozo)}
              </td>
              <td style={{ ...TD, textAlign: "right" }}>
                {fmtDec(d.zegarraPct)}%
              </td>
              <td
                style={{
                  ...TD,
                  textAlign: "right",
                  color: d.margen >= 0 ? "#047857" : "#b91c1c",
                  fontWeight: 700,
                }}
              >
                {d.margen >= 0 ? "+" : "−"}
                {fmtDec(Math.abs(d.margen))}
              </td>
              <td style={{ ...TD, textAlign: "right" }}>{fmtInt(d.pozo5)}</td>
              <td style={{ ...TD, textAlign: "right" }}>
                {d.meta10 > 0 ? `+${fmtInt(d.meta10)}` : "0"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          marginTop: 8,
          borderTop: "1px solid #cbd5e1",
          paddingTop: 5,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 7,
          lineHeight: 1.4,
          color: "#64748b",
        }}
      >
        <p style={{ margin: 0, maxWidth: "72%" }}>
          El pozo agrupa los votos de las candidaturas distintas de Zegarra y
          Huisa. El top 10 concentra {fmtDec(RESUMEN_DISTRITOS.coberturaTop10)}%
          del pozo de estos 15 distritos.
          Fuente: {FUENTE_ELECTORAL.url} · descarga{" "}
          {FUENTE_ELECTORAL.descarga}.
        </p>
        <div style={{ minWidth: 150 }}>
          <p style={{ margin: "0 0 18px" }}>Responsable de campo</p>
          <p style={{ margin: 0, borderTop: "1px solid #94a3b8", paddingTop: 2 }}>
            Nombre y firma
          </p>
        </div>
      </div>
    </article>
  );
}
