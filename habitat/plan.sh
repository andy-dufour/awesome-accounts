pkg_name=awesome-accounts
pkg_origin=andy-dufour
pkg_version=0.1.0
pkg_scaffolding=core/scaffolding-node
pkg_deps=(core/mysql-client)
pkg_binds=(
  [database]="username password port"
)
pkg_exports=(
  [port]=app.port
)
pkg_exposes=(port)

declare -A scaffolding_env

scaffolding_env[APP_CONFIG]="{{pkg.svc_config_path}}/config.json"
