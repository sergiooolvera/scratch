export function formatDuracion(duracion: string | null | undefined): string {
    if (!duracion) return '';
    const numMatch = String(duracion).match(/\d+/);
    if (!numMatch) return String(duracion);
    const num = parseInt(numMatch[0], 10);
    return `${num} ${num === 1 ? 'Hora' : 'Horas'}`;
}
