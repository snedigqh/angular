import {bootstrapWebworker} from "angular2/src/web-workers/worker/application";
import {TodoApp} from "./index_common";

export function main() {
  bootstrapWebworker(TodoApp);
}
