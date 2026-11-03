#!/usr/bin/env python3
"""
spec-guard.py — Guardião mecânico da Cadeia do Contrato (Spec-Anchored).
Inspirado nas diretrizes do CEIA/UFG e na Constituição CONST-001.

Verifica:
1. Toda Acceptance Criteria (AC) deve possuir um teste físico ancorado via @test:<caminho>.
2. Todo teste referenciado em @test: deve existir fisicamente no repositório.
3. Se houver código em 'src/' no stage do Git, 'openspec/' também deve ter sido alterado.
"""

import sys
import re
import os
import subprocess
from pathlib import Path

# Garante suporte a UTF-8 no Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parents[1]
OPENSPEC_DIR = ROOT / "openspec"

def check_git_staged_code_without_spec():
    """Garante que código não seja alterado sem correspondente alteração de spec."""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            check=True
        )
        staged_files = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    except Exception:
        return []

    # Se não há nada staged, nada a barrar por stage
    if not staged_files:
        return []

    code_staged = any(f.startswith("src/") for f in staged_files)
    spec_staged = any(f.startswith("openspec/") for f in staged_files)

    errors = []
    if code_staged and not spec_staged:
        errors.append(
            "❌ BLOQUEIO SPEC-ANCHORED: Arquivos em 'src/' foram alterados sem alteração correspondente em 'openspec/'!\n"
            "   (Constituição CONST-001: Mudou o comportamento? A spec muda primeiro.)"
        )
    return errors


def check_acs_and_tests():
    """Valida sintaxe das ACs e a existência dos arquivos de teste apontados por @test:."""
    errors = []
    if not OPENSPEC_DIR.exists():
        return errors

    ac_regex = re.compile(r"^-\s+\*\*AC-\d+\.\*\*", re.MULTILINE)
    test_tag_regex = re.compile(r"@test:([^\s]+)")

    spec_files = list(OPENSPEC_DIR.rglob("*.md"))

    for spec_file in spec_files:
        content = spec_file.read_text(encoding="utf-8", errors="ignore")
        lines = content.splitlines()

        for idx, line in enumerate(lines):
            if ac_regex.match(line.strip()):
                # Procura a tag @test: nesta linha ou na linha seguinte
                has_test_tag = False
                test_path = None

                match_same_line = test_tag_regex.search(line)
                if match_same_line:
                    has_test_tag = True
                    test_path = match_same_line.group(1)
                elif idx + 1 < len(lines):
                    match_next_line = test_tag_regex.search(lines[idx + 1])
                    if match_next_line:
                        has_test_tag = True
                        test_path = match_next_line.group(1)

                rel_spec = spec_file.relative_to(ROOT)
                if not has_test_tag:
                    errors.append(
                        f"❌ REGRA @test VIOLADA em '{rel_spec}' (linha {idx + 1}):\n"
                        f"   \"{line.strip()}\"\n"
                        f"   Toda AC deve apontar para o teste que a comprova (ex.: '@test:tests/...')."
                    )
                elif test_path:
                    # Verifica se o arquivo de teste existe no repositório
                    test_file = ROOT / test_path
                    if not test_file.exists():
                        errors.append(
                            f"❌ TESTE FANTASMA em '{rel_spec}' (linha {idx + 1}):\n"
                            f"   O arquivo de teste '{test_path}' não foi encontrado no disco!"
                        )

    return errors


def main():
    print("🛡️  Executando verificação mecânica da Cadeia do Contrato (spec-guard)...")
    errors = []

    # 1. Barreira de stage
    errors.extend(check_git_staged_code_without_spec())

    # 2. Barreira de ACs e @test:
    errors.extend(check_acs_and_tests())

    if errors:
        print("\n" + "=" * 70)
        print("🚨 FALHA NA VERIFICAÇÃO DO CONTRATO")
        print("=" * 70)
        for err in errors:
            print(f"\n{err}")
        print("\n" + "=" * 70)
        print("Corrija as inconsistências na especificação/testes antes de prosseguir.")
        sys.exit(1)

    print("✅ Contrato íntegro: Todas as ACs estão ancoradas e o código está alinhado à spec.")
    sys.exit(0)


if __name__ == "__main__":
    main()
