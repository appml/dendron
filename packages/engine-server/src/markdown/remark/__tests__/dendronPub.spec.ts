import { DendronSiteConfig, DEngineClientV2 } from "@dendronhq/common-all";
import { ENGINE_HOOKS, runEngineTestV4 } from "@dendronhq/common-test-utils";
import _ from "lodash";
import { createEngine } from "../../../enginev2";
import { DendronASTData, DendronASTDest } from "../../types";
import { MDUtilsV4 } from "../../utils";
import { DendronPubOpts } from "../dendronPub";

function proc(
  engine: DEngineClientV2,
  dendron: DendronASTData,
  opts?: DendronPubOpts
) {
  return MDUtilsV4.procFull({ engine, ...dendron, publishOpts: opts });
}

describe("basics", () => {
  let engine: any;
  let dendronData: DendronASTData = {
    dest: DendronASTDest.HTML,
  };

  test("imagePrefix", () => {
    const out = proc(engine, dendronData, {
      assetsPrefix: "bond/",
    }).processSync(`![alt-text](image-url.jpg)`);
    expect(_.trim(out.toString())).toEqual("![alt-text](/bond/image-url.jpg)");
  });

  test("imagePrefix2", () => {
    const out = proc(engine, dendronData, {
      assetsPrefix: "/bond/",
    }).processSync(`![alt-text](/image-url.jpg)`);
    expect(_.trim(out.toString())).toEqual("![alt-text](/bond/image-url.jpg)");
  });

  test("can't publish", async () => {
    await runEngineTestV4(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const config: DendronSiteConfig = {
          siteHierarchies: ["foo"],
          siteRootDir: "foo",
        };
        const resp = await MDUtilsV4.procRehype({
          proc: proc(
            engine,
            { ...dendronData, config, vault },
            {
              wikiLinkOpts: { useId: true },
              transformNoPublish: true,
            }
          ),
        }).process(`[[an alias|bar]]`);
        expect(resp).toMatchSnapshot();
        expect(resp.contents).toEqual(`<p><a href="403.html">an alias</a></p>`);
      },
      { expect, createEngine, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });
});
