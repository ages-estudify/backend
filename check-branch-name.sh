#!/bin/bash
local_branch_name="$(git rev-parse --abbrev-ref HEAD)"

# Regex para o padrão: tipo/nome-da-tarefa
valid_branch_regex="^(feature|fix|hotfix|chore|refactor)\([a-z0-9]+\)\/[a-z0-9-]+$"

if [[ ! $local_branch_name =~ $valid_branch_regex ]]
then
    echo "❌ Erro: Nome de branch inválido!"
    echo "Padrão: tipo(id_clickup)/nome-da-branch"
    exit 1
fi