import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE() {
  try {
    // Limpa APENAS a tabela de vendas_brutas, preservando as bases de configurações
    db.prepare('DELETE FROM vendas_brutas').run();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Base de vendas limpa com sucesso. As configurações foram mantidas!',
    });
  } catch (error) {
    console.error('Erro ao limpar banco:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar banco de dados.' },
      { status: 500 }
    );
  }
}
